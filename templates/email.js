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

const baseUrl = process.env.URL
  ? `https://${process.env.URL}`
  : "";

function Email(props) {
  const { userFirstname } = props;

  const steps = [
    {
        id: 1,
        Description: React.createElement(
            'li',
            { className: 'mb-20', key: 1 },
            React.createElement('strong', null, 'Customize Your Card.'),
            ' Use our easy-to-navigate tools to personalize your cards with your details and logo.'
        )
    },
    {
        id: 2,
        Description: React.createElement(
            'li',
            { className: 'mb-20', key: 2 },
            React.createElement('strong', null, 'Get Inspired.'),
            ' Visit our blog for tips on networking, branding, and making the most of your business cards.'
        )
    }
  ];

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
          'Welcome to Xclusive Touch! We are thrilled to have you on board.'
        ),
        React.createElement(
          Text,
          { style: paragraph },
          "Your registration is now complete, and you're all set to explore our unique selection of customizable business cards. Whether you're looking to make a lasting impression or simply elevate your brand, we've got you covered."
        ),
        React.createElement(Text, { style: paragraph }, "Here's what you can do next"),
        React.createElement('ul', null, steps.map(({ Description }) => Description)),
        React.createElement(Text, { style: paragraph }, 'Need Assistance?'),
        React.createElement(
          Text,
          { style: paragraph },
          'If you have any questions or need support, our customer service team is here to help! Feel free to reply to this email.'
        ),
        React.createElement(
          Text,
          { style: paragraph },
          "Thank you for choosing Xclusive Touch. We can't wait to help you create a business card that truly represents you!"
        ),
        React.createElement(
          Section,
          { style: btnContainer },
          React.createElement(Button, { style: button, href: 'https://www.xclusivetouch.ca/login', target: '_blank' }, 'Get started')
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