const IsFirstReq = (param) => {
  console.log(param);
  if (param) {
    return parseInt(param) === 0;
  }
  return true;
};

module.exports = IsFirstReq;
