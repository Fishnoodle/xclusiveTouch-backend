const React = require('react');
const {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} = require('@react-email/components');

function Email(props) {
  const { userFirstname, confirmationUrl } = props;

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, 'Welcome to Xclusive Touch Digital Business Card'),
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: container },
        React.createElement(Img, {
            src: 'https://xclusivetouch.ca/assets/gold_blackbackground.png',
            width: '200',
            height: '150',
            alt: 'Xclusive Touch Logo',
            style: logo
          }),
        React.createElement(Text, { style: paragraph }, `Hi ${userFirstname},`),
        React.createElement(
          Text,
          { style: paragraph },
          'Thank you for registering with Xclusive Touch!'
        ),
        React.createElement(
          Text,
          { style: paragraph },
          'To complete your registration and start creating your digital business card, please confirm your email address by clicking the button below:'
        ),
        React.createElement(
          Section,
          { style: btnContainer },
          React.createElement(
            Button, 
            { style: button, href: confirmationUrl }, 
            'Confirm Email Address'
          )
        ),
        React.createElement(
          Text,
          { style: paragraph },
          'Or copy and paste this link into your browser:'
        ),
        React.createElement(
          Text,
          { style: { ...paragraph, color: '#666', fontSize: '14px', wordBreak: 'break-all' } },
          confirmationUrl
        ),
        React.createElement(
          Text,
          { style: paragraph },
          'This link will expire in 24 hours for security reasons.'
        ),
        React.createElement(
          Text,
          { style: paragraph },
          "If you didn't create an account with Xclusive Touch, you can safely ignore this email."
        ),
        React.createElement(
          Text,
          { style: paragraph },
          'Best regards,',
          React.createElement('br', null),
          'The Xclusive Touch Team'
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(Text, { style: footer }, 'www.xclusivetouch.ca')
      )
    )
  );
}

module.exports = Email;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};

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
  color: "#8898aa",
  fontSize: "12px",
};