var express = require("express");
var router = express.Router();
const baseAuth = require("./base/authentication");
const _ = require("lodash");
const UTILS = require('../helpers/UTILS');

router.get("/", baseAuth.ensureAuthenticated, memberList);
router.get("/members", baseAuth.ensureAuthenticated, memberList);
router.post("/members/create-member", baseAuth.ensureAuthenticated, createMember);
router.post("/members/update-member", baseAuth.ensureAuthenticated, updateMember);
router.post("/members/new-member", baseAuth.ensureAuthenticated, newMember);
router.post("/members/modify-member", baseAuth.ensureAuthenticated, modifyMember);
router.post("/members/reset-password", baseAuth.ensureAuthenticated, resetPassword);

router.get("/cars", baseAuth.ensureAuthenticated, carsList);
router.post("/cars/create-car", baseAuth.ensureAuthenticated, createCar);
router.post("/cars/update-car", baseAuth.ensureAuthenticated, updateCar);
router.post("/cars/new-car", baseAuth.ensureAuthenticated, newCar);
router.post("/cars/modify-car", baseAuth.ensureAuthenticated, modifyCar);
router.post("/cars/reset-password", baseAuth.ensureAuthenticated, resetPassword);

// MEMBER ------------------------------------------------------------------------------------------------------------- //
function memberList(req, res) {
    if (!req.xhr || _.isEmpty(req.query)) {
        res.render("admin/membersList", {
            routesList: [],
            user: req.user
        });
    } else {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        let offset = !_.isUndefined(req.query.start) ?
            parseInt(req.query.start) :
            0;
        let limit = !_.isUndefined(req.query.length) ?
            parseInt(req.query.length) :
            DATA_TABLE_ROW;

        let draw = !_.isUndefined(req.query.draw) ? parseInt(req.query.draw) : 0;

        const query = new Parse.Query("_User");

        query.skip(offset);
        query.limit(limit);
        query.descending("createdAt");
        query.equalTo('role', 'KHACH')

        const promises = [];
        promises.push(query.find());
        promises.push(query.count());

        Promise.all(promises).then(results => {
            const total = results[1];
            const output = {
                draw: draw,
                recordsTotal: parseInt(total),
                recordsFiltered: parseInt(total),
                data: results[0]
            };
            res.send(output);
        });
    }
}

function createMember(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        if (user.role !== 'ADMIN') {
            throw "Have no permission";
        }

        const username = req.body.username;
        const hoTen = req.body.hoTen;
        const soDienThoai = req.body.soDienThoai;
        const diaChi = req.body.diaChi;
        const gioiTinh = req.body.gioiTinh;
        const emailUser = req.body.emailUser;

        if (!username || !hoTen || !soDienThoai || !emailUser) {
            throw "Phải nhập đầy đủ các thông tin cần thiết như tên tài khoản, họ tên khách, số điện thoại, email.";
        }

        const member = new Parse.Object('_User');
        member.set('username', username);
        member.set('password', '123456', {
            useMasterKey: true
        });
        member.set('hoTen', hoTen);
        member.set('soDienThoai', soDienThoai);
        member.set('diaChi', diaChi);
        member.set('role', 'KHACH');
        member.set('gioiTinh', gioiTinh);
        member.set('email', emailUser);
        member.set('emailUser', emailUser);

        member.save(null, {
                useMasterKey: true
            })
            .then(() => res.send('ok'))
            .catch(err => res.status(400).send(err));

    } catch (error) {
        res.status(400).send(error);
    }
}

function updateMember(req, res) {
    try {

        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        if (user.role !== 'ADMIN') {
            throw "Have no permission";
        }

        const hoTen = req.body.hoTen;
        const soDienThoai = req.body.soDienThoai;
        const diaChi = req.body.diaChi;
        const gioiTinh = req.body.gioiTinh;

        if (!hoTen || !soDienThoai) {
            throw "Phải nhập đầy đủ các thông tin cần thiết như tên tài khoản, họ tên khách, số điện thoại.";
        }


        const query = new Parse.Query('User');
        query.equalTo('objectId', req.body.objectId);
        query.first()
            .then(member => {
                member.set('hoTen', hoTen);
                member.set('soDienThoai', soDienThoai);
                member.set('diaChi', diaChi);
                member.set('gioiTinh', gioiTinh);

                member.save(null, {
                        useMasterKey: true
                    })
                    .then(() => res.send('ok'))
                    .catch(err => res.status(400).send(err));
            })
            .catch(err => res.status(400).send(err));

    } catch (error) {
        res.status(400).send(error);
    }
}

function newMember(req, res) {
    res.render("admin/newMember", {
        layout: "layouts/noneLayout"
    });
}

function modifyMember(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        if (user.role !== 'ADMIN') {
            throw "Have no permission";
        }

        const query = new Parse.Query('_User');
        query.matches('objectId', req.body.id);
        query.first()
            .then(result => {
                res.render("admin/modifyMember", {
                    layout: "layouts/noneLayout",
                    member: result.toJSON()
                });
            })
            .catch(err => res.status(400).send(err));

    } catch (error) {
        res.status(400).send(error);
    }
}


// CARS ------------------------------------------------------------------------------------------------------------- //
function carsList(req, res) {
    if (!req.xhr || _.isEmpty(req.query)) {
        res.render("admin/carsList", {
            routesList: [],
            user: req.user
        });
    } else {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        let offset = !_.isUndefined(req.query.start) ?
            parseInt(req.query.start) :
            0;
        let limit = !_.isUndefined(req.query.length) ?
            parseInt(req.query.length) :
            DATA_TABLE_ROW;

        let draw = !_.isUndefined(req.query.draw) ? parseInt(req.query.draw) : 0;

        const query = new Parse.Query("_User");

        query.skip(offset);
        query.limit(limit);
        query.descending("createdAt");
        query.equalTo('role', 'NHAXE')

        const promises = [];
        promises.push(query.find());
        promises.push(query.count());

        Promise.all(promises).then(results => {
            const total = results[1];
            const output = {
                draw: draw,
                recordsTotal: parseInt(total),
                recordsFiltered: parseInt(total),
                data: results[0]
            };
            res.send(output);
        });
    }
}


function createCar(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        if (user.role !== 'ADMIN') {
            throw "Have no permission";
        }

        const username = req.body.username;
        const hoTen = req.body.hoTen;
        const soDienThoai = req.body.soDienThoai;
        const diaChi = req.body.diaChi;
        const maDoanhNghiep = req.body.maDoanhNghiep;
        const noiCapMaDoanhNghiep = req.body.noiCapMaDoanhNghiep;
        const maSoThue = req.body.maSoThue;
        const soTaiKhoan = req.body.soTaiKhoan;

        if (!username || !hoTen || !soDienThoai) {
            throw "Phải nhập đầy đủ các thông tin cần thiết như tên tài khoản, họ tên khách, số điện thoại.";
        }

        if (!maDoanhNghiep || !noiCapMaDoanhNghiep || !maSoThue || !soTaiKhoan) {
            throw "Phải nhập đầy đủ các thông tin cần thiết như mã doanh nghiệp, nơi cấp, mã số thuế và số tài khoản.";
        }

        const member = new Parse.Object('_User');
        member.set('username', username);
        member.set('password', '123456', {
            useMasterKey: true
        });
        member.set('hoTen', hoTen);
        member.set('soDienThoai', soDienThoai);
        member.set('diaChi', diaChi);
        member.set('role', 'NHAXE');
        member.set('maDoanhNghiep', maDoanhNghiep);
        member.set('noiCapMaDoanhNghiep', noiCapMaDoanhNghiep);
        member.set('maSoThue', maSoThue);
        member.set('soTaiKhoan', soTaiKhoan);
        member.set('tenHangXe', hoTen);

        member.save(null, {
                useMasterKey: true
            })
            .then(() => res.send('ok'))
            .catch(err => res.status(400).send(err));
    } catch (error) {
        res.status(400).send(error);
    }
}

function updateCar(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        if (user.role !== 'ADMIN') {
            throw "Have no permission";
        }

        const objectId = req.body.objectId;
        const hoTen = req.body.hoTen;
        const soDienThoai = req.body.soDienThoai;
        const diaChi = req.body.diaChi;
        const maDoanhNghiep = req.body.maDoanhNghiep;
        const noiCapMaDoanhNghiep = req.body.noiCapMaDoanhNghiep;
        const maSoThue = req.body.maSoThue;
        const soTaiKhoan = req.body.soTaiKhoan;

        if (!hoTen || !soDienThoai) {
            throw "Phải nhập đầy đủ các thông tin cần thiết như tên tài khoản, họ tên khách, số điện thoại.";
        }

        if (!maDoanhNghiep || !noiCapMaDoanhNghiep || !maSoThue || !soTaiKhoan) {
            throw "Phải nhập đầy đủ các thông tin cần thiết như mã doanh nghiệp, nơi cấp, mã số thuế và số tài khoản.";
        }

        const query = new Parse.Query('_User');
        query.matches('objectId', objectId);
        query.first()
            .then(member => {
                member.set('hoTen', hoTen);
                member.set('soDienThoai', soDienThoai);
                member.set('diaChi', diaChi);
                member.set('maDoanhNghiep', maDoanhNghiep);
                member.set('noiCapMaDoanhNghiep', noiCapMaDoanhNghiep);
                member.set('maSoThue', maSoThue);
                member.set('soTaiKhoan', soTaiKhoan);
                member.set('tenHangXe', hoTen);

                member.save(null, {
                        useMasterKey: true
                    })
                    .then(() => res.send('ok'))
                    .catch(err => res.status(400).send(err));
            })
            .catch(err => res.status(400).send(err));


    } catch (error) {
        res.status(400).send(error);
    }
}

function newCar(req, res) {
    res.render("admin/newCar", {
        layout: "layouts/noneLayout"
    });
}

function modifyCar(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        if (user.role !== 'ADMIN') {
            throw "Have no permission";
        }

        const query = new Parse.Query('_User');
        query.matches('objectId', req.body.id);
        query.first()
            .then(result => {
                res.render("admin/modifyCar", {
                    layout: "layouts/noneLayout",
                    car: result.toJSON()
                });
            })
            .catch(err => res.status(400).send(err));
    } catch (error) {
        res.status(400).send(error);
    }
}

function resetPassword(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        if (user.role !== 'ADMIN') {
            throw "Have no permission";
        }

        const query = new Parse.Query('_User');
        query.matches('objectId', req.body.objectId);
        query.first()
            .then(member => {
                member.set('password', '123456', {
                    useMasterKey: true
                });

                member.save(null, {
                        useMasterKey: true
                    })
                    .then(() => res.send('ok'))
                    .catch(err => res.status(400).send(err));
            })
            .catch(err => res.status(400).send(err));

    } catch (error) {
        res.status(400).send(error);
    }
}

module.exports = router;