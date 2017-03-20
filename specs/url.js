'use strict';

const expect = require('expect.js');
const Url = require('../src/url');

describe('Url', () => {
    const host = 'jenkins-host';
    const port = 42;
    const username = 'hudson';
    const token = 'super-secret';

    /* eslint-disable no-new */
    it('should require host', () => { expect(() => { new Url({ }); }).to.throwError(); });
    /* eslint-enable no-new */

    it('should cast to an http URL string', () => { expect(new Url({ host }).toString()).to.be(`http://${host}`); });

    it('should cast to an https URL string', () => {
        expect(new Url({ host, https: true }).toString()).to.be(`https://${host}`);
    });

    it('should reject invalid port number', () => {
        /* eslint-disable no-new */
        expect(() => { new Url({ host, port: 'foo' }); }).to.throwError();
        /* eslint-enable no-new */
    });

    it('should cast to an URL with port', () => {
        expect(new Url({ host, port }).toString()).to.be(`http://${host}:${port}`);
    });

    it('should reject incomplete authentication', () => {
        /* eslint-disable no-new */
        expect(() => { new Url({ host, username }); }).to.throwError();
        expect(() => { new Url({ host, token }); }).to.throwError();
        /* eslint-enable no-new */
    });

    it('should cast to an URL with authentication', () => {
        expect(new Url({ host, username, token }).toString()).to.be(`http://${username}:${token}@${host}`);
    });
});
