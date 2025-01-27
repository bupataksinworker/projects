function checkLoggedIn(req) {
    // ผู้ใช้ล็อกอินอยู่
    const loggedInUsername = req.session.username;
    // console.log(`User ${loggedInUsername} is logged in.`);
    return req.session && req.session.username;
  }
  
  module.exports = {
    checkLoggedIn,
  };
  