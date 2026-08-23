const fs = require('fs');
const file = '/Users/biplab/Desktop/getway/client/src/features/dashboard/pages/ApiDocumentation/ApiDocumentation.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix Go Payin string
content = content.replace("payload := strings.NewReader(`{", "payload := strings.NewReader(`\\`{");
content = content.replace("}`)\n\n  client", "}\\``)\n\n  client");

fs.writeFileSync(file, content);
