"""
Setup script to verify installation and dependencies.
Run this before running the main pipeline.
"""

import sys
import subprocess
import importlib

def check_python_version():
    """Check if Python version is compatible."""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required!")
        print(f"   Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} (compatible)")
    return True


def check_dependencies():
    """Check if all required packages are installed."""
    print("\n📦 Checking dependencies...")
    
    required_packages = [
        'aiohttp',
        'pymongo',
        'torch',
        'transformers',
        'sentence_transformers',
        'keybert',
        'tqdm',
        'numpy'
    ]
    
    missing = []
    for package in required_packages:
        try:
            importlib.import_module(package.replace('-', '_'))
            print(f"✓ {package}")
        except ImportError:
            print(f"❌ {package} - NOT INSTALLED")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print("   Install with: pip install -r requirements.txt")
        return False
    
    return True


def check_mongodb():
    """Check if MongoDB is accessible."""
    print("\n🗄️  Checking MongoDB connection...")
    try:
        from pymongo import MongoClient
        import config
        
        client = MongoClient(config.MONGODB_URI, serverSelectionTimeoutMS=3000)
        client.server_info()
        print("✓ MongoDB connection successful")
        print(f"   URI: {config.MONGODB_URI}")
        client.close()
        return True
    except Exception as e:
        print("❌ MongoDB connection failed!")
        print(f"   Error: {str(e)}")
        print("\n   Solutions:")
        print("   1. Install MongoDB: https://www.mongodb.com/try/download/community")
        print("   2. Start MongoDB service")
        print("   3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas")
        return False


def check_gpu():
    """Check if GPU is available."""
    print("\n🎮 Checking GPU availability...")
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            print(f"✓ GPU available: {gpu_name}")
            print("   Pipeline will use GPU for faster processing")
            return True
        else:
            print("⚠️  No GPU detected")
            print("   Pipeline will use CPU (slower but functional)")
            return False
    except:
        print("⚠️  Could not check GPU status")
        return False


def check_api_key():
    """Check if NewsAPI keys are configured."""
    print("\n🔑 Checking NewsAPI configuration...")
    try:
        import config
        
        # Check if NEWS_API_KEYS list exists and has valid keys
        if hasattr(config, 'NEWS_API_KEYS') and config.NEWS_API_KEYS:
            valid_keys = [k for k in config.NEWS_API_KEYS if k and k != "your_api_key_here"]
            
            if valid_keys:
                print(f"✓ {len(valid_keys)} API key(s) configured")
                for i, key in enumerate(valid_keys, 1):
                    print(f"   Key #{i}: {key[:10]}...{key[-4:]}")
                
                if len(valid_keys) == 1:
                    print("\n   💡 Tip: Add more API keys to avoid rate limits!")
                    print("      Edit config.py and add keys to NEWS_API_KEYS list")
                    print("      See API_KEYS_GUIDE.md for details")
                elif len(valid_keys) >= 3:
                    print("\n   ✨ Great! Multiple keys configured for high availability")
                
                return True
            else:
                print("❌ No valid API keys found!")
                print("   Edit config.py and add keys to NEWS_API_KEYS list")
                print("   Get a free key at: https://newsapi.org/register")
                return False
        
        # Fallback to old NEWS_API_KEY check
        elif hasattr(config, 'NEWS_API_KEY') and config.NEWS_API_KEY and config.NEWS_API_KEY != "your_api_key_here":
            print("✓ NewsAPI key configured (legacy format)")
            print(f"   Key: {config.NEWS_API_KEY[:10]}...")
            print("\n   💡 Consider using NEWS_API_KEYS list for multiple keys")
            return True
        else:
            print("❌ NewsAPI key not configured!")
            print("   Edit config.py and set NEWS_API_KEYS")
            print("   Get a free key at: https://newsapi.org/register")
            return False
    except Exception as e:
        print(f"❌ Could not load config.py: {str(e)}")
        return False


def download_models():
    """Pre-download required models."""
    print("\n🤖 Pre-downloading AI models...")
    print("   This may take a few minutes on first run...")
    
    try:
        from transformers import pipeline
        from sentence_transformers import SentenceTransformer
        import config
        
        print("\n   1. Downloading zero-shot classifier...")
        _ = pipeline("zero-shot-classification", model=config.ZERO_SHOT_MODEL)
        print("   ✓ Zero-shot classifier ready")
        
        print("\n   2. Downloading embedding model...")
        _ = SentenceTransformer(config.EMBEDDING_MODEL)
        print("   ✓ Embedding model ready")
        
        print("\n   3. Downloading sentiment model...")
        _ = pipeline("sentiment-analysis", model=config.SENTIMENT_MODEL)
        print("   ✓ Sentiment model ready")
        
        print("\n✓ All models downloaded and cached")
        return True
        
    except Exception as e:
        print(f"\n⚠️  Model download issue: {str(e)}")
        print("   Models will download automatically when first used")
        return False


def main():
    """Run all checks."""
    print("="*70)
    print("🚀 NEWS ARTICLE PIPELINE - SETUP VERIFICATION")
    print("="*70)
    
    checks = []
    
    # Critical checks
    checks.append(("Python Version", check_python_version()))
    checks.append(("Dependencies", check_dependencies()))
    checks.append(("MongoDB", check_mongodb()))
    checks.append(("NewsAPI Key", check_api_key()))
    
    # Optional checks
    checks.append(("GPU (optional)", check_gpu()))
    
    # Summary
    print("\n" + "="*70)
    print("📋 SETUP SUMMARY")
    print("="*70)
    
    for name, status in checks:
        icon = "✓" if status else "❌"
        print(f"{icon} {name}")
    
    critical_passed = all([checks[i][1] for i in [0, 1, 2, 3]])
    
    if critical_passed:
        print("\n✅ All critical checks passed!")
        print("\n   You can now run the pipeline:")
        print("   python main.py")
        
        # Optional: Download models
        download = input("\n   Download AI models now? (y/n): ").lower().strip()
        if download == 'y':
            download_models()
    else:
        print("\n❌ Some critical checks failed!")
        print("   Please fix the issues above before running the pipeline.")
        sys.exit(1)
    
    print("\n" + "="*70)
    print("Setup verification complete!")
    print("="*70)


if __name__ == "__main__":
    main()
