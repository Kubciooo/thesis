const tryCatch = async (fn) => {
  return (req, res, next) => fn(req, res, next).catch((error) => next(error));
};

export default tryCatch;
