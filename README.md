# hodlol
Algo trading platform for cryptocurrencies


### Getting things running
1. Clone the repo.
1. [Verify the commit you've checked out](#full-paranoia-verification) (optional).
1. Run `npm install`.
1. Setup your binance API key/secret by duplicating `env/dev.example.env` to `env/dev.env` and filling in appropriately.
1. Run `npm run test-dev`. If all the tests pass, you should be good.


### Full Paranoia Verification
Since hodlol accesses sensitive shit like your precious money, I've decided to sign all commits and tags. If there end up being more contributors, you should make sure the commit you're checking out is verified by me/someone you trust. Github puts a little "verified" flag on all such commits; you can also verify a commit locally with `git verify-commit <commit>`.

However, if you want to go full paranoid nutter, you should find my public key on a keyserver like https://pgp.mit.edu and verify that the commit you checked out is, in fact, authentic. You do this by finding `HEAD` in your `.git` directory and splitting out the signature and commit into separate files, then running `gpg --verify commit.sig commit` once you've added my public key to your keyring. This should be about as secure as you can be, assuming you trust me.
