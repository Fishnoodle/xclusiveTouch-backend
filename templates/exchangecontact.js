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

function Email(props) {
    const { user, name, email, message } = props;

    return React.createElement(
        Html,
        null,
        React.createElement(Head, null),
        React.createElement(Preview, null, 'XclusiveTouch Exchange Contact'),
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
                React.createElement(Text, { style: text }, `Hi ${user},`),
                React.createElement(
                    Section
                ),
                React.createElement(
                    Text,
                    { style: text },
                    `${name} has shared their contact information with you.`
                ),
                React.createElement(
                    Text,
                    { style: text },
                    `Email: ${email}`
                ),
                React.createElement(
                    Text,
                    { style: text },
                    `Message: ${message}`
                ),
                // React.createElement(
                //     Section,
                //     { style: btnContainer },
                //     React.createElement(Button, { style: button, href: `https://www.xclusivetouch.ca/login`, target: '_blank'}, 'Login')
                // ),
            )
        )
    )
}

module.exports = Email;

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

