const validate = (schema) => async (req, res, next) => {
  try {
    
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    
    req.validated = parsed;

    return next();
  } catch (error) {
    
    return next(error);
  }
};

module.exports = validate;