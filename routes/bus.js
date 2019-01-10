var express = require("express");
var router = express.Router();
const baseAuth = require("./base/authentication");
const _ = require("lodash");
const UTILS = require('../helpers/UTILS');
const moment = require('moment');

router.get("/", baseAuth.ensureAuthenticated, busList);
router.post("/create-bus", baseAuth.ensureAuthenticated, createBus);
router.post("/update-bus", baseAuth.ensureAuthenticated, updateBus);
router.post("/new-bus", baseAuth.ensureAuthenticated, newBus);
router.post("/modify-bus", baseAuth.ensureAuthenticated, modifyBus);
router.post("/create-ticket", baseAuth.ensureAuthenticated, createTicket);
router.post("/modify-bus-ticket", baseAuth.ensureAuthenticated, modifyBusTicket);

function busList(req, res) {
    if (!req.xhr || _.isEmpty(req.query)) {
        res.render("bus/busList", {
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

        const subQuery = UTILS.buildPointerQuery("User");
        subQuery.equalTo('objectId', user.objectId);

        const query = new Parse.Query("TuyenXe");
        query.matchesQuery('hangXe', subQuery);

        query.skip(offset);
        query.limit(limit);
        query.descending("createdAt");
        query.include(["loTrinh", "xe"]);

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

function createBus(req, res) {
    try {
        const loTrinhId = req.body.loTrinhId;
        const xeId = req.body.xeId;
        const giaVe = req.body.giaVe;
        const thoiGian = req.body.thoiGian;

        const user = req.user;
        if (!user) {
            throw "Cần đăng nhập trước!";
        }

        if (!loTrinhId) {
            throw "Phải chọn lộ trình cho tuyến xe";
        }

        if (!xeId) {
            throw "Phải chọn xe khách cho lộ trình";
        }

        if (!giaVe) {
            throw "Phải nhập giá vé cho tuyến xe";
        }

        if (!thoiGian || thoiGian.length < 1) {
            throw "Phải chọn thời gian cho tuyến xe";
        }

        const LoTrinh = Parse.Object.extend('LoTrinh');
        const loTrinhPointer = new LoTrinh();
        loTrinhPointer.id = loTrinhId;

        const Xe = Parse.Object.extend('Xe');
        const xePointer = new Xe();
        xePointer.id = xeId;

        const User = Parse.Object.extend("_User");
        const userPointer = new User();
        userPointer.id = user.objectId;

        const tuyenXe = new Parse.Object('TuyenXe');
        tuyenXe.set('hangXe', userPointer);
        tuyenXe.set('loTrinh', loTrinhPointer);
        tuyenXe.set('xe', xePointer);
        tuyenXe.set('giaVe', Number(giaVe));
        tuyenXe.set('thoiGian', thoiGian);
        tuyenXe.set('trangThai', 'ACTIVED');

        tuyenXe.save({}, {
                useMasterKey: true
            })
            .then(() => res.send('ok'))
            .catch((err) => res.status(400).send(err));
    } catch (error) {
        res.status(400).send(error);
    }
}

function updateBus(req, res) {
    try {
        const tuyenXeId = req.body.objectId;
        const giaVe = req.body.giaVe;
        const thoiGian = req.body.thoiGian;

        const user = req.user;
        if (!user) {
            throw "Cần đăng nhập trước!";
        }

        if (!tuyenXeId) {
            throw "Failed";
        }

        if (!giaVe) {
            throw "Phải nhập giá vé cho tuyến xe";
        }

        if (!thoiGian || thoiGian.length < 1) {
            throw "Phải chọn thời gian cho tuyến xe";
        }

        const User = Parse.Object.extend("_User");
        const userPointer = new User();
        userPointer.id = user.objectId;


        const queryTuyen = new Parse.Query('TuyenXe');
        queryTuyen.matches('objectId', tuyenXeId);
        queryTuyen.first()
            .then((tuyenXe) => {
                tuyenXe.set('giaVe', Number(giaVe));
                tuyenXe.set('thoiGian', thoiGian);
                tuyenXe.set('trangThai', req.body.trangThai);

                tuyenXe.save({}, {
                        useMasterKey: true
                    })
                    .then(() => res.send('ok'))
                    .catch((err) => res.status(400).send(err));
            })
            .catch(err => res.status(400).send(err));

    } catch (error) {
        res.status(400).send(error);
    }
}

function newBus(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        const userPointer = UTILS.createBlankPointerTo('_User', user.objectId);

        const queryLoTrinh = new Parse.Query('LoTrinh');
        queryLoTrinh.descending('createdAt');
        queryLoTrinh.equalTo('idHangXe', userPointer);

        const queryXe = new Parse.Query('Xe');
        queryXe.descending('createdAt');
        queryXe.equalTo('idHangXe', userPointer);

        const promise = [];
        promise.push(queryLoTrinh.find());
        promise.push(queryXe.find());

        Promise.all(promise).then(result => {
                res.render("bus/newBus", {
                    layout: "layouts/noneLayout",
                    dsLoTrinh: UTILS.parseObjectArray2JSON(result[0]),
                    dsXe: UTILS.parseObjectArray2JSON(result[1])
                });
            })
            .catch(err => res.status(400).send(err));
    } catch (err) {
        res.status(400).send(err);
    }
}

function modifyBus(req, res) {
    try {
        const queryTuyen = new Parse.Query('TuyenXe');
        queryTuyen.matches('objectId', req.body.id);

        queryTuyen.include(['loTrinh', 'xe']);

        queryTuyen.first()
            .then(tuyenXe => {
                res.render("bus/modifyBus", {
                    layout: "layouts/noneLayout",
                    bus: tuyenXe.toJSON()
                });
            })
            .catch(err => res.status(400).send(err));
    } catch (err) {
        res.status(400).send(err);
    }
}

function createTicket(req, res) {
    try {
        const ngayThang = new Date(req.body.ngayThang);
        const thoiGian = req.body.thoiGian;
        const giaVe = req.body.giaVe;

        const user = req.user;

        if (!user) {
            throw "Require login";
        }

        if (!ngayThang) {
            throw "Phải chọn thời gian để tạo vé";
        }

        const queryTuyen = new Parse.Query('TuyenXe');
        queryTuyen.matches('objectId', req.body.objectId);
        queryTuyen.first()
            .then(tuyenXe => {
                tuyenXe.set('giaVe', Number(giaVe));

                const hangXePointer = UTILS.createBlankPointerTo('_User', user.objectId);
                const loTrinhPointer = UTILS.createBlankPointerTo('LoTrinh', req.body.loTrinhId);
                const xePointer = UTILS.createBlankPointerTo('Xe', req.body.xeId);

                const saveAll = [];
                saveAll.push(tuyenXe);

                for (const i in thoiGian) {
                    if (thoiGian[i] && thoiGian[i] !== null && thoiGian[i] !== '') {
                        const taoTuyen = new Parse.Object('Tuyen');
                        taoTuyen.set('idLoTrinh', loTrinhPointer);
                        taoTuyen.set('idXe', xePointer);
                        taoTuyen.set('idHangXe', hangXePointer);
                        taoTuyen.set('trangThai', 'ACTIVED');
                        taoTuyen.set('giaVe', Number(giaVe));

                        let timer = thoiGian[i].split(':');
                        timer = moment(ngayThang).hour(timer[0]).minute(timer[1]);

                        taoTuyen.set('thoiGianKhoiHanh', new Date(timer.toString()));

                        saveAll.push(taoTuyen);
                    }
                }

                Parse.Object.saveAll(saveAll, {
                        useMasterKey: true
                    })
                    .then(async (dsTuyen) => {
                        const xeChiTiet = await UTILS.fetchObject('Xe', 'objectId', req.body.xeId, ['idLoaiXe']);
                        const soChoNgoi = xeChiTiet.get('idLoaiXe').toJSON()['soCho'];

                        if (!Number(soChoNgoi)) {
                            throw "Car's seats failed";
                        }

                        const toanBoVe = [];
                        for (const tuyen in dsTuyen) {
                            if (tuyen > 0) {
                                for (let i = 1; i <= Number(soChoNgoi); i++) {
                                    const taoVe = new Parse.Object('Ve');
                                    taoVe.set('idTuyen', dsTuyen[tuyen]);
                                    taoVe.set('daDat', false);
                                    taoVe.set('idCho', UTILS.setIDSeat(i));
                                    taoVe.set('giaVe', Number(giaVe));
                                    taoVe.set('hangXe', hangXePointer);
                                    toanBoVe.push(taoVe);
                                }
                            }
                        }

                        Parse.Object.saveAll(toanBoVe, {
                                useMasterKey: true
                            })
                            .then(() => res.send('ok'))
                            .catch((err) => res.status(400).send(err));
                    })
                    .catch(err => res.status(400).send(err));
            })
            .catch(err => req.status(400).send(err));

    } catch (err) {
        res.status(400).send(err);
    }
}

function modifyBusTicket(req, res) {
    try {
        const queryTuyen = new Parse.Query('TuyenXe');
        queryTuyen.matches('objectId', req.body.id);

        queryTuyen.include(['loTrinh', 'xe']);

        queryTuyen.first()
            .then(tuyenXe => {
                res.render("bus/createTicket", {
                    layout: "layouts/noneLayout",
                    bus: tuyenXe.toJSON()
                });
            })
            .catch(err => res.status(400).send(err));
    } catch (err) {
        res.status(400).send(err);
    }
}

module.exports = router;