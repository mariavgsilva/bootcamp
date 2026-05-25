function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Erro interno do servidor" : err.message,
  });
}

module.exports = errorHandler;
