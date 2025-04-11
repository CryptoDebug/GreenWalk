const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'FR' },
    { name: 'stateOrProvinceName', value: 'Ile-de-France' },
    { name: 'localityName', value: 'Paris' },
    { name: 'organizationName', value: 'Clean Walk' },
    { name: 'organizationalUnitName', value: 'Development' }
];

const pems = selfsigned.generate(attrs, {
    algorithm: 'sha256',
    days: 365,
    keySize: 2048,
    extensions: [
        {
            name: 'basicConstraints',
            cA: true
        },
        {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true
        },
        {
            name: 'extKeyUsage',
            serverAuth: true,
            clientAuth: true,
            codeSigning: true,
            timeStamping: true
        },
        {
            name: 'subjectAltName',
            altNames: [
                {
                    type: 2, // DNS
                    value: 'localhost'
                },
                {
                    type: 7, // IP
                    ip: '127.0.0.1'
                }
            ]
        }
    ]
});

if (!fs.existsSync('ssl')) {
    fs.mkdirSync('ssl');
}

fs.writeFileSync(path.join('ssl', 'private.key'), pems.private);
fs.writeFileSync(path.join('ssl', 'certificate.crt'), pems.cert);

console.log('Certificats générés avec succès dans le dossier ssl/'); 