import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("Admin", "Student", "Driver").default("Student"),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const changePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
});



export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(30).required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name should have at least {#limit} characters',
      'string.max': 'Name should not exceed {#limit} characters'
    }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).allow('')
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits'
    }),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').allow(''),
  dob: Joi.date().max('now').allow('')
    .messages({
      'date.max': 'Birth date cannot be in the future'
    }),
  age: Joi.number().integer().min(1).max(120).allow('')
    .messages({
      'number.min': 'Age must be at least 1',
      'number.max': 'Age cannot exceed 120'
    })
}).options({ abortEarly: false });