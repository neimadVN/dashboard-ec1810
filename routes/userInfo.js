var express = require("express");
var router = express.Router();
const baseAuth = require("./base/authentication");
const _ = require("lodash");
const UTILS = require('../helpers/UTILS');

router.get("/", baseAuth.ensureAuthenticated, userInfo);
router.post("/update-user", baseAuth.ensureAuthenticated, updateUser);
router.post("/get-user", baseAuth.ensureAuthenticated, getUser);
router.post("/change-password", baseAuth.ensureAuthenticated, changePassword);
router.post("/get-changeUI", baseAuth.ensureAuthenticated, getChangePassword);
router.post("/update-policy", baseAuth.ensureAuthenticated, updatePolicy);
router.post("/get-policy", baseAuth.ensureAuthenticated, getPolicy);

function userInfo(req, res) {
    if (!req.user) {
        throw "Require login";
    }

    const subQuery = UTILS.buildPointerQuery("User");
    subQuery.equalTo('objectId', req.user.objectId);

    const queryChinhSach = new Parse.Query('ChinhSachHuy');
    queryChinhSach.matchesQuery('idHangXe', subQuery);

    queryChinhSach.first()
        .then(result => {
            if (result) {
                res.render("userInfo/userInfo", {
                    user: req.user,
                    chinhSach: result.toJSON()
                });
            } else {
                res.render("userInfo/userInfo", {
                    user: req.user,
                    chinhSach: null
                });
            }
        })
        .catch(err => res.status(400).send(err));
}

function updateUser(req, res) {
    try {
        const queryMember = new Parse.Query("User");
        queryMember.equalTo("objectId", req.body.objectId);
        queryMember
            .first()
            .then(member => {
                //Set value for object
                member.set("diaChi", req.body.truSo);
                member.set("soDienThoai", req.body.duongDayNong);
                member.set("website", req.body.website);
                member.set("maDoanhNghiep", req.body.maDoanhNghiep);
                member.set("noiCapMaDoanhNghiep", req.body.noiCapMaDoanhNghiep);
                member.set("maSoThue", req.body.maSoThue);
                member.set("soTaiKhoan", req.body.soTaiKhoan);

                //Save Object
                member
                    .save({}, {
                        useMasterKey: true
                    })
                    .then(() => res.send("ok"))
                    .catch(error => res.status(400).send(error));
            })
            .catch(error => res.status(400).send(error));
    } catch (error) {
        res.status(400).send(error);
    }
}

function getUser(req, res) {
    const id = req.body.id;
    try {
        const queryMember = new Parse.Query("User");
        queryMember.equalTo("objectId", id);
        queryMember.equalTo("role", "NHAXE");
        const promise = [];
        promise.push(queryMember.first());

        Promise.all(promise).then(result => {
            res.render("userInfo/editInfo", {
                layout: "layouts/noneLayout",
                user: result[0].toJSON()
            });
        });
    } catch (error) {
        res.status(400).send(error);
    }
}

function changePassword(req, res) {
    try {
        const queryMember = new Parse.Query("User");
        queryMember.equalTo("objectId", req.body.objectId);
        queryMember
            .first()
            .then(member => {
                //Set value for object
                if (req.body.newPassword !== "" && req.body.confirmPassword !== "" && req.body.newPassword === req.body.confirmPassword) {
                    member.set("password", req.body.newPassword, {
                        useMasterKey: true
                    });

                    member
                        .save({}, {
                            useMasterKey: true
                        })
                        .then(() => res.send("ok"))
                        .catch(error => res.status(400).send(error));
                } else {
                    member.then(() => res.send("failed"));
                }

            })
            .catch(error => res.status(400).send(error));
    } catch (error) {
        res.status(400).send(error);
    }
}

function getChangePassword(req, res) {
    const id = req.body.id;
    try {
        const queryMember = new Parse.Query("User");
        queryMember.equalTo("objectId", id);
        queryMember.equalTo("role", "NHAXE");
        const promise = [];
        promise.push(queryMember.first());

        Promise.all(promise).then(result => {
            res.render("userInfo/changePassword", {
                layout: "layouts/noneLayout",
                user: result[0].toJSON()
            });
        });
    } catch (error) {
        res.status(400).send(error);
    }
}

function updatePolicy(req, res) {
    try {
        const objectId = req.body.objectId;
        const chinhSach1 = req.body.chinhSach1;
        const chinhSach2 = req.body.chinhSach2;
        const thoiGian1 = req.body.thoiGian1;
        const thoiGian2 = req.body.thoiGian2;
        const moTa1 = req.body.moTa1;
        const moTa2 = req.body.moTa2;

        const user = req.user;
        if (!user){
            throw "Require login";
        }

        if (!chinhSach1 || !chinhSach2 || !thoiGian1 || !thoiGian2) {
            throw "Không được để trống các trường dữ liệu. Bạn có thể để 0 nếu không cài đặt chính sách.";
        }

        if (Number(chinhSach1) > 100 || Number(chinhSach1) < 0) {
            throw "Tỉ lệ hoàn tiền từ 0 - 100% so với giá vé. Vui lòng nhập lại.";
        }

        if (Number(chinhSach2) > 100 || Number(chinhSach2) < 0) {
            throw "Tỉ lệ hoàn tiền từ 0 - 100% so với giá vé. Vui lòng nhập lại.";
        }

        if (Number(thoiGian1) > 50 || Number(thoiGian1) < 0) {
            throw "Thời gian hủy vé chỉ từ 0 - 50 giờ trước khởi hành. Vui lòng nhập lại.";
        }

        if (Number(thoiGian2) > 50 || Number(thoiGian2) < 0) {
            throw "Thời gian hủy vé chỉ từ 0 - 50 giờ trước khởi hành. Vui lòng nhập lại.";
        }

        if (!objectId) {
            const userPointer = UTILS.createBlankPointerTo('_User', user.objectId);
            const chinhSach = new Parse.Object('ChinhSachHuy');
            chinhSach.set('idHangXe', userPointer);
            chinhSach.set('chinhSach1', Number(chinhSach1));
            chinhSach.set('chinhSach2', Number(chinhSach2));
            chinhSach.set('thoiGian1', Number(thoiGian1));
            chinhSach.set('thoiGian2', Number(thoiGian2));
            chinhSach.set('moTa1', moTa1);
            chinhSach.set('moTa2', moTa2);
    
            chinhSach.save(null, {
                useMasterKey: true
            })
            .then(()=> res.send('ok'))
            .catch(err => res.status(400).send(err));
        }
        else {
            const query = new Parse.Query('ChinhSachHuy');
            query.matches('objectId', objectId);
            query.first()
            .then(chinhSach => {
                chinhSach.set('chinhSach1', Number(chinhSach1));
                chinhSach.set('chinhSach2', Number(chinhSach2));
                chinhSach.set('thoiGian1', Number(thoiGian1));
                chinhSach.set('thoiGian2', Number(thoiGian2));
                chinhSach.set('moTa1', moTa1);
                chinhSach.set('moTa2', moTa2);
        
                chinhSach.save(null, {
                    useMasterKey: true
                })
                .then(()=> res.send('ok'))
                .catch(err => res.status(400).send(err));
            })
            .catch(err => res.status(400).send(err));
        }
    } catch (error) {
        res.status(400).send(error);
    }
}

function getPolicy(req, res) {
    try {
        if (!req.user) {
            throw "Require login";
        }

        const subQuery = UTILS.buildPointerQuery("User");
        subQuery.equalTo('objectId', req.user.objectId);

        const queryChinhSach = new Parse.Query('ChinhSachHuy');
        queryChinhSach.matchesQuery('idHangXe', subQuery);

        queryChinhSach.first()
            .then(result => {
                if (result) {
                res.render("userInfo/editPolicy", {
                    layout: "layouts/noneLayout",
                    chinhSach: result.toJSON()
                });
            }
            else {
                const emptyPolicy = {
                    objectId: null,
                    chinhSach1: 0,
                    chinhSach2: 0,
                    moTa1: '',
                    moTa2: '',
                    thoiGian1: 0,
                    thoiGian2: 0
                };

                res.render("userInfo/editPolicy", {
                    layout: "layouts/noneLayout",
                    chinhSach: emptyPolicy
                });
            }
            })
            .catch(err => res.status(400).send(err));
    } catch (error) {
        res.status(400).send(error);
    }
}

module.exports = router;