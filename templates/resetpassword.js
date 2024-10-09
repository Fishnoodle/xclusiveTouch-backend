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
    const { userFirstname, id } = props;

    return React.createElement(
        Html,
        null,
        React.createElement(Head, null),
        React.createElement(Preview, null, 'XclusiveTouch reset your password'),
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
                React.createElement(Text, { style: text }, `Hi ${userFirstname},`),
                React.createElement(
                    Section
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'Someone recently request a password change for you XclusiveTouch account. If this was you, you can set a new password here:'
                ),
                React.createElement(
                    Section,
                    { style: btnContainer },
                    React.createElement(Button, { style: button, href: `https://www.xclusivetouch.ca/resetpassword/${id}`, target: '_blank'}, 'Reset Password')
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'If you did not want to change your password or did not request this, just ignore and delete this message.'
                ),
                React.createElement(
                    Text,
                    { style: text },
                    'To keep your account secure, please do not forward this email to anyone. This email will expire in 15 minutes.',
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

