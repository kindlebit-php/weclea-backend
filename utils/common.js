// email format validation using regex
export const email_format = (email) => {
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?:\.com|\.net)$/;
  return emailRegexp.test(email)
    ? emailRegexp.test(email)
    : "Please provide a valid email address.";
};

// password validation using regex
export const password_format = (password) => {
  if (password.length < 8 || password.length > 15) {
    return "Your password must be 8 to 15 characters!";
  } else {
    //const passwordRegexp =  /^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*[\d|@#$!%*?&])[\p{L}\d@#$!%*?&]{8,50}$/;
  const passwordRegexp =
    /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^a-zA-Z0-9]).{7,15}$/;
    return passwordRegexp.test(password)
      ? passwordRegexp.test(password)
      : "Your password should contain at least one uppercase, one lowercase, one special character and one numeric character.";
  }
};

// compare two dates
export const compare_future_date = (date) => {
  const currentDate = new Date();
  const futureDate = new Date(date);
  return futureDate > currentDate ? true : false;
};

// show error if past date and time
export const past_time_validation = (value) => {
  console.log(value);
  var selectedDate = new Date(value);
  // Get the user's timezone offset in minutes
  var timezoneOffset = selectedDate.getTimezoneOffset();
  // Convert the selected date to Indian timezone
  var indianTime = new Date(
    selectedDate.getTime() - timezoneOffset * 60 * 1000 + 5.5 * 60 * 60 * 1000
  );
  return indianTime < new Date()
    ? "Past Time, Please choose current and future time!"
    : true;
};
