this code was originally taken from Authress openapi-data-validator.
It was heavily modified by Dallin@qloo to generally word things more to our liking, and take in a customErrorsFn that inserts special wordings for certain parameters errors

It was then gutted by Hahn@qloo removing a lot of unneeded functionality, to load AJV at the module level (so prewarmed lambdas won't have to lazy load at request time), and made to use the latest version of Typescript.  This results in some really ugly typing kludges due to time constraints.  Ideally someone would go through and tidy this all up, and set up some tests.
