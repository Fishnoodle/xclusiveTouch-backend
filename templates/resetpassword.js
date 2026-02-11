const React = require('react');
const {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} = require('@react-email/components');

const baseUrl = process.env.URL
    ? `https://${process.env.URL}`
    : "";

function ResetPassword(props) {
    const { userEmail, resetUrl } = props;

    return React.createElement(
        Html,
        null,
        React.createElement(Head, null),
        React.createElement(Preview, null, 'Reset Your Xclusive Touch Password'),
        React.createElement(
            Body,
            { style: main },
            React.createElement(
                Container,
                { style: container },
                React.createElement(Img, {
                    src: 'https://xclusivetouch.ca/assets/gold_blackbackground.png',
                    width: '500',
                    height: '172',
                    alt: 'Xclusive Touch Logo',
                    style: logo,
                }),
                React.createElement(Text, { style: text }, `Hello,`),
                React.createElement(
                    Section
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'We received a request to reset the password for your Xclusive Touch account. Click the button below to set a new password:'
                ),
                React.createElement(
                    Section,
                    { style: btnContainer },
                    React.createElement(Button, { style: button, href: resetUrl, target: '_blank'}, 'Reset Password')
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'Or copy and paste this URL into your browser:'
                ),
                React.createElement(
                    Text,
                    { style: linkText },
                    resetUrl
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'If you did not request a password reset, please ignore this email. Your password will remain unchanged.'
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'For security reasons, this link will expire in 15 minutes. Do not forward this email to anyone.',
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'Best regards,',
                    React.createElement('br', null),
                    'The Xclusive Touch Team'
                ),
                React.createElement(Hr, { style: hr }),
                React.createElement(Text, { style: footer}, 'www.xclusivetouch.ca')
            )
        )
    )
}

module.exports = ResetPassword;

const main = {
    backgroundColor: '#f6f9fc',
    padding: '10px 0'
}

const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    padding: '45px'
}

const logo = {
    margin: '0 auto',
}

const text = {
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '300',
}

const linkText = {
    fontSize: '14px',
    lineHeight: '24px',
    fontWeight: '300',
    color: '#0066cc',
    wordBreak: 'break-all',
}

const btnContainer = {
    textAlign: "center",
  };
  

const button = {
    backgroundColor: "#D4AF37",
    borderRadius: "3px",
    color: "#fff", // Text color set to white
    fontSize: "16px",
    textDecoration: "none",
    textAlign: "center",
    display: "block",
    padding: "12px",
  };

const hr = {
    borderColor: "#cccccc",
    margin: "20px 0",
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
}

