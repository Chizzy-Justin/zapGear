const resendButton = document.getElementById('resend-otp');
const resendTimer = document.getElementById('resend-timer');
const otpFields = document.querySelectorAll('.otp-input');
const verifyButton = document.getElementById('verify-otp');
let timerCount = 60;
let intervalId; // Variable to store the interval ID

// Function to start the resend timer
function startTimer() {
  intervalId = setInterval(() => {
    timerCount--;
    resendTimer.textContent = timerCount;
    if (timerCount === 0) {
      clearInterval(intervalId);
      resendButton.classList.remove('disabled');  
  resendButton.disabled = false;
    }
  }, 1000); // Update timer every second
}

// Focus on the first OTP field on page load
otpFields[0].focus();

// Handle focus and input for each OTP field
otpFields.forEach((field, index) => {
  field.addEventListener('input', () => {
    if (field.value.length === 1) {
      // Move focus to the next field if the current field is filled
      if (index < otpFields.length - 1) {
        otpFields[index + 1].focus();
      } else {
        // Focus on the verify button if last field is filled
        verifyButton.focus();
      }
    } else if (field.value.length === 0) {
      // Move focus to the previous field if the current field is emptied
      if (index > 0) {
        otpFields[index - 1].focus();
      }
    }
  });

  // Handle paste event to distribute OTP across fields
  field.addEventListener('paste', (event) => {
    event.preventDefault(); // Prevent default paste behavior
    const pastedText = event.clipboardData.getData('text');
    if (pastedText.length === otpFields.length) {
      // If pasted text length matches number of fields, distribute across fields
      otpFields.forEach((otpField, idx) => {
        otpField.value = pastedText[idx];
        if (idx < otpFields.length - 1) {
          otpFields[idx + 1].focus();
        }
      });
    }
  });
});

resendButton.addEventListener('click', () => {
  const data = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    address: document.getElementById('address').value,
    zipCode: document.getElementById('zipCode').value,
    state: document.getElementById('state').value,
    country: document.getElementById('country').value,
    phoneNumber: document.getElementById('phoneNumber').value,
    isLoggedIn: document.getElementById('isLoggedIn').value,
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    cartList: JSON.parse(document.getElementById('cartList').value),
    cartListBtnIdList: JSON.parse(document.getElementById('cartListBtnIdList').value),
    itemQty: JSON.parse(document.getElementById('itemQty').value),
    hashedOtp: document.getElementById('hashedOtp').value
};
  // Clear the existing interval
  clearInterval(intervalId);
   // Clear current values in OTP input fields
   otpFields.forEach(field => {
    field.value = '';
  });
  resendButton.classList.add('disabled');
  resendButton.disabled = true;
  
  // Set a timeout to enable the resend button after 60 seconds
  setTimeout(() => {
    resendButton.classList.remove('disabled');
    resendButton.disabled = false;
   
  }, 60000); 
 
  timerCount = 60;
  resendTimer.textContent = timerCount;
  startTimer(); // Start the timer again
  fetch('/resend-otp', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
});


// Start the resend timer on page load
startTimer();
