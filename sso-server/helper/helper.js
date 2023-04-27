const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const sendTokenResponse = (user) => {
    const token = jwt.sign({user}, process.env.JWT_SECRET);
    console.log(token);
    return token
};


module.exports = {

    getLoginUser: function (req) {
        return new Promise(async (resolve) => {

            const { users } = req.db;

            const {email, password} = req.body;
            console.log(req.body)

            //validation email and password
            if (!email || !password) {
                return next(new ErrorResponse('Please enter email id and password', 400));
            }
            //check for user

            users.findOne({where: {email_Id: email}})
                .then(async (user) => {
                    console.log("🚀 ~ file: authRoute.js ~ line 47 ~  email_Id, password }", user)
                    if (user == null) {
                        resolve({message: "Invalid credential", status: 401});
                    }else {
                        const isMatch = async () => {
                            //check if password matchs
                            // let hashedPassword = await bcrypt.hashSync(password, 8);
                            const _isMatch = bcrypt.compareSync(password, user.password);
                            console.log("🚀 ~ file: authRoute.js ~ line 622 ~ isMatch ~ hashedPassword", _isMatch, user.password,)
                            return _isMatch;
                        };

                        isMatch().then((resp) => {
                            // console.log("🚀 ~ file: authRoute.js ~ line 62 ~ isMatch ~ hashedPassword, user.password", resp)
                            if (resp) {
                                const token = jwt.sign({user}, process.env.JWT_SECRET);
                                resolve({status: 200, token: token})
                            } else {
                                resolve({status: 401, message: "wrong crentials"});
                            }
                        })
                    }
                });


        })
    },


}