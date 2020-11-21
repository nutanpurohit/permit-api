module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "parser": "babel-eslint",
    "rules": {
        "indent": ["error", 4],
        "consistent-return": [0],
        "arrow-body-style": [0],
        "no-param-reassign": [0],
        "max-len": [0],
        "no-use-before-define": [0],
        "no-restricted-globals": [0],
        "radix": [0],
    },
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    }
};
