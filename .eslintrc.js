module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "parser": "babel-eslint",
    "rules": {
        "indent": ["error", 4],
        "consistent-return": [0],
        "arrow-body-style": [0]
    },
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    }
};
