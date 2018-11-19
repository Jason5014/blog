
//验证器模块

module.exports = {
    phone: function(phone){
        //以13、14、15、18开头的十三位数字
        var reg = /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/g;
        return reg.test(phone.trim());
    },
    email: function(email){
        var reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
        return reg.test(email.trim());
    },
    date: function(date){
        //形式如：2000/01/01 或 2000-01-01
        var reg = /^[1-9]\d{3}[\/|-](0[1-9]|1[0-2])[\/|-](0[1-9]|[1-2][0-9]|3[0-1])$/;
        return reg.test(date.trim());
    }
};
