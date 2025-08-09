// EmailJS configuration
const emailConfig = {
    medical: {
        serviceId: 'servxxxxxxxxxx',
        templateId: 'templxxxxxxxxxx',
        subject: 'New Medical Aid Request'
    },
    transport: {
        serviceId: 'servxxxxxxxxxx',
        templateId: 'templxxxxxxxxxx',
        subject: 'New Transport Aid Request'
    },
    volunteer: {
        serviceId: 'servxxxxxxxxxx',
        templateId: 'tempxxxxxxxxxxv',
        subject: 'New Volunteer Registration'
    }
};

// Twilio configuration
const twilioConfig = {
    accountSid: 'AC5xxxxxhggvvghvg',
    authToken: '1xxxxxhggvvghvg',
    phoneNumber: '+xxxxxxxxxx'
};

// Initialize EmailJS
(function() {
    emailjs.init("kjhbhjbb");
})();

function formatVolunteerData(formData) {
    return {
        name: formData.get('name'),
        location: formData.get('location'),
        contactNumber: formData.get('contactNumber'),
        disasterType: formData.get('disastertype'),
        numPeople: formData.get('numpeople'),
        severity: formData.get('severity'),
        additionalInfo: 'Volunteer Registration'
    };
}

function showLoadingAlert() {
    Swal.fire({
        title: 'Submitting...',
        text: 'Please wait while we process your request',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function showSuccessAlert(formType) {
    const messages = {
        medical: 'Medical aid request submitted successfully! Our team will contact you shortly.',
        transport: 'Transport request submitted successfully! Help is on the way.',
        volunteer: 'Thank you for volunteering! We appreciate your support.'
    };

    Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: messages[formType] || 'Form submitted successfully!',
        confirmButtonColor: '#28a745'
    });
}

function showErrorAlert(error) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'There was an error submitting your request. Please try again.',
        footer: error ? `Error details: ${error.message}` : '',
        confirmButtonColor: '#dc3545'
    });
}

async function sendSMS(formData, formType) {
    // Debug: Log the start of SMS sending
    console.log('Starting SMS send process...');

    let phoneNumber = formData.get('contactNumber') || '97xxxxxx';
    if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+91' + phoneNumber.replace(/\D/g, '');
    }
    
    // Debug: Log the formatted phone number
    console.log('Formatted phone number:', phoneNumber);
    
    const messageBody = "Your aid request has been successfully submitted. Our teams will get to you shortly.";

    // Debug: Log message details
    console.log('Message to send:', {
        to: phoneNumber,
        from: twilioConfig.phoneNumber,
        body: messageBody
    });

    try {
        // Debug: Log API call attempt
        console.log('Attempting Twilio API call...');
        
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`;
        console.log('Twilio API URL:', url);

        const auth = btoa(twilioConfig.accountSid + ':' + twilioConfig.authToken);
        const formBody = new URLSearchParams({
            To: phoneNumber,
            From: twilioConfig.phoneNumber,
            Body: messageBody
        });

        // Debug: Log request details
        console.log('Request details:', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + auth.substring(0, 10) + '...' // Only log part of auth token
            },
            body: formBody.toString()
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + auth
            },
            body: formBody
        });

        // Debug: Log raw response
        const responseText = await response.text();
        console.log('Raw API Response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
            console.log('Parsed API Response:', data);
        } catch (e) {
            console.error('Failed to parse response:', e);
            throw new Error('Invalid response from Twilio');
        }

        if (!response.ok) {
            throw new Error(data.message || `SMS failed with status ${response.status}`);
        }

        // Success!
        console.log('SMS sent successfully! Message SID:', data.sid);
        return data;
    } catch (error) {
        console.error('Detailed SMS Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

async function sendEmail(formData, formType) {
    const config = emailConfig[formType.toLowerCase()];
    if (!config) {
        throw new Error('Invalid form type');
    }

    let templateParams = formType === 'volunteer' ? formatVolunteerData(formData) : Object.fromEntries(formData.entries());
    templateParams.subject = config.subject;
    
    // Add submission time
    templateParams.submissionTime = new Date().toLocaleString('en-US', { 
        dateStyle: 'full', 
        timeStyle: 'long',
        hour12: true
    });

    try {
        showLoadingAlert();

        // Send email
        await emailjs.send(
            config.serviceId,
            config.templateId,
            templateParams
        );

        // Try to send SMS
        try {
            await sendSMS(formData, formType);
        } catch (smsError) {
            console.error('SMS failed but email sent:', smsError);
        }

        showSuccessAlert(formType);
    } catch (error) {
        console.error('Error:', error);
        showErrorAlert(error);
    }
}

// Form Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const forms = {
        'medicalAidForm': 'medical',
        'transportAidForm': 'transport',
        'volunteerForm': 'volunteer'
    };

    Object.entries(forms).forEach(([formId, formType]) => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                await sendEmail(formData, formType);
            });
        }
    });
});

async function testTwilioSetup() {
    try {
        const testFormData = new FormData();
        testFormData.set('contactNumber', '9704178229');
        testFormData.set('name', 'Test User');
        testFormData.set('location', 'Test Location');
        
        await sendSMS(testFormData, 'medical');
        console.log('Twilio test successful!');
    } catch (error) {
        console.error('Twilio test failed:', error);
    }
}

// Call this in browser console to test: testTwilioSetup()