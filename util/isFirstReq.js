const IsFirstReq = (param) => {
  console.log(param);
  if (param) {
    return parseInt(param) === 0;
  }
  return false;
};

module.exports = IsFirstReq;
