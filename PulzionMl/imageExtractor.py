#!/usr/bin/env python3
"""
Delete all articles that do NOT have a valid urlToImage.
Safe, with preview + confirmation.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# --------------------- Load Config ---------------------
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
COLLECTION_NAME = "articles"

# --------------------- Connect ---------------------
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# --------------------- Stats BEFORE ---------------------
total = collection.count_documents({})
with_image = collection.count_documents({
    "urlToImage": {"$exists": True, "$ne": None, "$ne": ""}
})
without_image = total - with_image

print("Current Collection Summary".center(50, "-"))
print(f"Total articles       : {total:,}")
print(f"With image (urlToImage) : {with_image:,}")
print(f"Without image        : {without_image:,}")
print("-" * 50)

if without_image == 0:
    print("Nothing to delete. All articles have images.")
    client.close()
    exit(0)

# --------------------- Confirm Deletion ---------------------
print(f"\nYou are about to DELETE {without_image:,} articles without images.")
print("This action is IRREVERSIBLE.\n")

confirm = input("Type 'DELETE' to proceed: ").strip().upper()

if confirm != "DELETE":
    print("Operation cancelled.")
    client.close()
    exit(0)

# --------------------- Perform Deletion ---------------------
print(f"\nDeleting {without_image:,} articles without urlToImage...", end=" ")

# Delete all docs where urlToImage is missing, null, or empty string
result = collection.delete_many({
    "$or": [
        {"urlToImage": {"$exists": False}},
        {"urlToImage": None},
        {"urlToImage": ""}
    ]
})

print(f"Done! {result.deleted_count} deleted.")

# --------------------- Stats AFTER ---------------------
new_total = collection.count_documents({})
new_with_image = collection.count_documents({
    "urlToImage": {"$exists": True, "$ne": None, "$ne": ""}
})

print("\nAfter Cleanup".center(50, "-"))
print(f"Remaining articles   : {new_total:,}")
print(f"With image           : {new_with_image:,}")
print(f"Percentage with image: {100.0:.2f}%" if new_total > 0 else "N/A")
print("-" * 50)

client.close()