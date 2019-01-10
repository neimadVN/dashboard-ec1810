var express = require("express");
var router = express.Router();
const baseAuth = require("./base/authentication");
const _ = require("lodash");
const UTILS = require('../helpers/UTILS');

router.get("/", baseAuth.ensureAuthenticated, routesInfo);
router.post("/create-route", baseAuth.ensureAuthenticated, createRoute);
router.post("/update-route", baseAuth.ensureAuthenticated, updateRoute);
router.post("/new-route", baseAuth.ensureAuthenticated, newRoute);
router.post("/modify-route", baseAuth.ensureAuthenticated, modifyRoute);

function routesInfo(req, res) {
    if (!req.xhr || _.isEmpty(req.query)) {
        res.render("routes/routesList", {
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

        const query = new Parse.Query("LoTrinh");
        query.matchesQuery('idHangXe', subQuery);

        query.skip(offset);
        query.limit(limit);
        query.descending("createdAt");
        query.include("huyenTinhDi");
        query.include("huyenTinhDen");

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

function createRoute(req, res) {
    try {
        let diemDi = req.body.diemDi;
        const diemDiMoi = req.body.diemDiMoi;
        let diemDen = req.body.diemDen;
        const diemDenMoi = req.body.diemDenMoi;
        const thoiGian = req.body.thoiGian;

        const user = req.user;
        if (!user) {
            throw "Yêu cầu đăng nhập";
        }

        if (!diemDi && !diemDiMoi) {
            throw "Phải chọn một điểm đi.";
        }

        if (!diemDen && !diemDenMoi) {
            throw "Phải chọn một điểm đến.";
        }

        if (!thoiGian) {
            throw "Phải nhập thời gian dự kiến của lộ trình.";
        }

        if (diemDi && diemDen && diemDi === diemDen) {
            throw "Điểm đi phải khác điểm đến.";
        }

        if (!diemDi && !diemDen && diemDiMoi === diemDenMoi) {
            throw "Điểm đi phải khác điểm đến.";
        }

        // Check starting route point
        const saveAll = [];

        const diemDiPointer = new Parse.Object("HuyenTinh");
        if (!diemDi && diemDiMoi) {
            diemDi = diemDiMoi;
            diemDiPointer.set("huyenTinh", diemDiMoi);
            saveAll.push(diemDiPointer);
        }
        // Check ending route point
        const diemDenPointer = new Parse.Object("HuyenTinh");
        if (!diemDen && diemDenMoi) {
            diemDen = diemDenMoi;
            diemDenPointer.set("huyenTinh", diemDenMoi);

            saveAll.push(diemDenPointer);
        }
        const User = Parse.Object.extend("_User");
        const userPointer = new User();
        userPointer.id = user.objectId;

        const loTrinhPointer = new Parse.Object("LoTrinh");
        loTrinhPointer.set("idHangXe", userPointer);
        loTrinhPointer.set("huyenTinhDi", diemDi);
        loTrinhPointer.set("huyenTinhDen", diemDen);
        loTrinhPointer.set('thoiGianDuKien', Number(thoiGian));
        loTrinhPointer.set("trangThai", "ACTIVED");
        loTrinhPointer.set('diemDon', req.body.diemDon);
        loTrinhPointer.set('diemTra', req.body.diemTra);

        saveAll.push(loTrinhPointer);

        Parse.Object.saveAll(saveAll, {
                useMasterKey: true
            })
            .then(() => res.send('ok'))
            .catch(error => res.status(400).send(error));
    } catch (error) {
        res.status(400).send(error);
    }
}

function updateRoute(req, res) {
    try {
        const thoiGian = req.body.thoiGian;

        const user = req.user;
        if (!user) {
            throw "Yêu cầu đăng nhập";
        }
        
        if (!thoiGian) {
            throw "Phải nhập thời gian dự kiến của lộ trình.";
        }

        // Check starting route point
        const saveAll = [];

        const queryLoTrinh = new Parse.Query("LoTrinh");
        queryLoTrinh.equalTo('objectId', req.body.objectId);
        queryLoTrinh.first()
            .then(loTrinh => {
                loTrinh.set('thoiGianDuKien', Number(thoiGian));
                loTrinh.set('trangThai', req.body.trangThai);
                loTrinh.set('diemDon', req.body.diemDon);
                loTrinh.set('diemTra', req.body.diemTra);

                saveAll.push(loTrinh);

                Parse.Object.saveAll(saveAll, {
                        useMasterKey: true
                    })
                    .then(() => res.send('ok'))
                    .catch(error => res.status(400).send(error));
            })
            .catch(error => res.status(400).send(error));
    } catch (error) {
        res.status(400).send(error);
    }
}

function newRoute(req, res) {
    try {
        const queryHuyenTinh = new Parse.Query('HuyenTinh');
        queryHuyenTinh.ascending('huyenTinh');
        queryHuyenTinh.find()
            .then(result => {
                res.render("routes/newRoute", {
                    layout: "layouts/noneLayout",
                    dsDiaDiem: UTILS.parseObjectArray2JSON(result)
                });
            })
            .catch(error => {
                res.status(400).send(error);
            });
    } catch (error) {
        res.status(400).send(error);
    }
}

function modifyRoute(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        const queryHuyenTinh = new Parse.Query('HuyenTinh');
        queryHuyenTinh.ascending('huyenTinh');

        const queryLoTrinh = new Parse.Query('LoTrinh');
        queryLoTrinh.equalTo("objectId", req.body.id);

        const promise = [];
        promise.push(queryHuyenTinh.find());
        promise.push(queryLoTrinh.first());

        Promise.all(promise)
            .then(result => {
                res.render("routes/modifyRoute", {
                    layout: "layouts/noneLayout",
                    dsDiaDiem: UTILS.parseObjectArray2JSON(result[0]),
                    route: result[1].toJSON()
                });
            })
            .catch(error => {
                res.status(400).send(error);
            });
    } catch (error) {
        res.status(400).send(error);
    }
}

module.exports = router;