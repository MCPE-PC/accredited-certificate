# Accredited Certificate

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/KoalaSign/accredited-certificate/Node.js%20CI?style=flat-square&logoColor=959da5)](https://github.com/KoalaSign/accredited-certificate/actions/workflows/node.js.yml)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FKoalaSign%2Faccredited-certificate.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2FKoalaSign%2Faccredited-certificate?ref=badge_small)

공동인증서를 분석하는 도구입니다

## Try me...

1. `yarn add accredited-certificate`
1. 공동인증서를 가지고 노십시오
```javascript
const {AccreditedCertificatePair} = require('accredited-certificate');
const {readFileSync} = require('fs');

const pair = new AccreditedCertificatePair(readFileSync('signCert.der'), readFileSync('signPri.key'), 'Replace with your p@ssw0rd');

// Some codes...

require('repl').start().context.pair = pair;

// Node.js REPL will be like: > pair.verifyVirtualID('1234561234567');
```

## Too many TODOs

기여하십시오
