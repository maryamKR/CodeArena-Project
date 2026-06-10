const validate = (schema) => async (req, res, next) => {
  try {
    
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) {
      Object.keys(req.query).forEach(key => delete req.query[key]);
      Object.assign(req.query, parsed.query);
    }
    if (parsed.params) {
      Object.keys(req.params).forEach(key => delete req.params[key]);
      Object.assign(req.params, parsed.params);
    }

    return next();
  } catch (error) {
    
    return next(error);
  }
};

module.exports = validate;