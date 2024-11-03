document.getElementById('resetPasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    validateForm();
    if (document.querySelector('.custom-btn').style.backgroundColor === 'rgb(0, 66, 131)') {
        sendResetPasswordRequest();
    }
});

const newPasswordField = document.getElementById('newPassword');
const confirmPasswordField = document.getElementById('confirmPassword');
const toggleNewPassword = document.getElementById('toggleNewPassword');
const toggleNewPasswordVisible = document.getElementById('toggleNewPasswordVisible');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const toggleConfirmPasswordVisible = document.getElementById('toggleConfirmPasswordVisible');
const resetButton = document.querySelector('.custom-btn');
const passwordCriteriaElements = document.querySelectorAll('.password-criteria span');

toggleNewPassword.addEventListener('click', function() {
    togglePasswordVisibility(newPasswordField, toggleNewPassword, toggleNewPasswordVisible);
});

toggleNewPasswordVisible.addEventListener('click', function() {
    togglePasswordVisibility(newPasswordField, toggleNewPassword, toggleNewPasswordVisible);
});

toggleConfirmPassword.addEventListener('click', function() {
    togglePasswordVisibility(confirmPasswordField, toggleConfirmPassword, toggleConfirmPasswordVisible);
});

toggleConfirmPasswordVisible.addEventListener('click', function() {
    togglePasswordVisibility(confirmPasswordField, toggleConfirmPassword, toggleConfirmPasswordVisible);
});

newPasswordField.addEventListener('focus', function() {
    document.getElementById('passwordCriteria').style.display = 'block';
});

newPasswordField.addEventListener('input', function() {
    validatePassword();
    matchPasswords();
});

confirmPasswordField.addEventListener('input', matchPasswords);

function togglePasswordVisibility(field, eye, eyeSlash) {
    if (field.type === 'password') {
        field.type = 'text';
        eye.style.display = 'none';
        eyeSlash.style.display = 'inline';
    } else {
        field.type = 'password';
        eye.style.display = 'inline';
        eyeSlash.style.display = 'none';
    }
}

function validatePassword() {
    const newPassword = newPasswordField.value;
    const lengthCriteria = document.getElementById('lengthCriteria');
    const specialCharCriteria = document.getElementById('specialCharCriteria');
    const numberCriteria = document.getElementById('numberCriteria');
    const upperCaseCriteria = document.getElementById('upperCaseCriteria');
    const lowerCaseCriteria = document.getElementById('lowerCaseCriteria');
    const nameCriteria = document.getElementById('nameCriteria');

    if (newPassword.length >= 8) {
        lengthCriteria.classList.remove('invalid');
        lengthCriteria.classList.add('valid');
    } else {
        lengthCriteria.classList.remove('valid');
        lengthCriteria.classList.add('invalid');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        specialCharCriteria.classList.remove('invalid');
        specialCharCriteria.classList.add('valid');
    } else {
        specialCharCriteria.classList.remove('valid');
        specialCharCriteria.classList.add('invalid');
    }

    if (/\d/.test(newPassword)) {
        numberCriteria.classList.remove('invalid');
        numberCriteria.classList.add('valid');
    } else {
        numberCriteria.classList.remove('valid');
        numberCriteria.classList.add('invalid');
    }

    if (/[A-Z]/.test(newPassword)) {
        upperCaseCriteria.classList.remove('invalid');
        upperCaseCriteria.classList.add('valid');
    } else {
        upperCaseCriteria.classList.remove('valid');
        upperCaseCriteria.classList.add('invalid');
    }

    if (/[a-z]/.test(newPassword)) {
        lowerCaseCriteria.classList.remove('invalid');
        lowerCaseCriteria.classList.add('valid');
    } else {
        lowerCaseCriteria.classList.remove('valid');
        lowerCaseCriteria.classList.add('invalid');
    }

    const firstName = 'John';
    const lastName = 'Doe';
    if (!newPassword.toLowerCase().includes(firstName.toLowerCase()) && !newPassword.toLowerCase().includes(lastName.toLowerCase())) {
        nameCriteria.classList.remove('invalid');
        nameCriteria.classList.add('valid');
    } else {
        nameCriteria.classList.remove('valid');
        nameCriteria.classList.add('invalid');
    }

    matchPasswords();
}

function matchPasswords() {
    const newPassword = newPasswordField.value;
    const confirmPassword = confirmPasswordField.value;
    const passwordError = document.getElementById('passwordError');

    if (newPassword !== confirmPassword || confirmPassword === '') {
        passwordError.innerText = 'Passwords do not match';
        resetButton.style.backgroundColor = '#D3D3D3';
    } else {
        passwordError.innerText = '';

        const allValid = Array.from(passwordCriteriaElements).every(element => element.classList.contains('valid'));

        if (allValid) {
            resetButton.style.backgroundColor = '#004283';
        } else {
            resetButton.style.backgroundColor = '#D3D3D3';
        }
    }
}

function validateForm() {
    const newPassword = newPasswordField.value;
    const confirmPassword = confirmPasswordField.value;
    const passwordError = document.getElementById('passwordError');

    validatePassword();

    if (newPassword !== confirmPassword) {
        passwordError.innerText = 'Passwords do not match';
    } else {
        const allValid = Array.from(passwordCriteriaElements).every(element => element.classList.contains('valid'));

        if (allValid) {
            passwordError.innerText = '';
        } else {
            passwordError.innerText = 'Please make sure your password meets all criteria';
        }
    }
}

async function sendResetPasswordRequest() {
    const token = window.location.pathname.split('/').pop();
    const newPassword = newPasswordField.value;

    try {
        const response = await fetch('https://qiot-beta-f5013130cafe.herokuapp.com/api/v1/auth/resetpassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: newPassword,
                token: token
            })
        });

        if (response.ok) {
            // Reset form fields and show success message
            newPasswordField.value = '';
            confirmPasswordField.value = '';
            resetButton.style.backgroundColor = '#D3D3D3';
            showSuccessMessage('Password reset successful!');
        } else {
            const errorData = await response.json();
            showErrorMessage(`Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('An error occurred while resetting the password.');
    }
}

function showSuccessMessage(message) {
    const formContainer = document.querySelector('.container');
    formContainer.innerHTML = `
        <div class="text-center mb-4">
            <a href="https://qiot.co.uk" target="_blank">
                <img src="https://res.cloudinary.com/qiot-ltd/image/upload/v1720487970/QIoT-Beta/logo.png" alt="QIoT Logo"
                    class="img-fluid" style="width: 128px; height: 128px; border-radius: 8px;">
            </a>
        </div>
        <p class="reset text-center">${message}</p>
    `;
}

function showErrorMessage(message) {
    alert(message); // Alternatively, you can replace this with a more styled error display within the HTML structure.
}