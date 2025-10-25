
export const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};


export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  return { isValid: true, message: '' };
};


export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, message: 'Username is required' };
  }
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  if (username.length > 30) {
    return { isValid: false, message: 'Username cannot exceed 30 characters' };
  }
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { isValid: true, message: '' };
};


export const validateRegistrationForm = (formData) => {
  const errors = {};
  let isValid = true;

  const usernameValidation = validateUsername(formData.username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.message;
    isValid = false;
  }

  if (!formData.email) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
    isValid = false;
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
    isValid = false;
  }

  return { isValid, errors };
};

export const validateLoginForm = (formData) => {
  const errors = {};
  let isValid = true;

  if (!formData.email) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }

  if (!formData.password) {
    errors.password = 'Password is required';
    isValid = false;
  }

  return { isValid, errors };
};
