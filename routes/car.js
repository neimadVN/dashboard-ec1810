var express = require("express");
var router = express.Router();
const baseAuth = require("./base/authentication");
const _ = require("lodash");
const UTILS = require('../helpers/UTILS');

router.get("/", baseAuth.ensureAuthenticated, carsInfo);
router.post("/create-car", baseAuth.ensureAuthenticated, createCar);
router.post("/update-car", baseAuth.ensureAuthenticated, updateCar);
router.post("/get-UI-create", baseAuth.ensureAuthenticated, getUICreate);
router.post("/get-UI-update", baseAuth.ensureAuthenticated, getUIUpdate);

function carsInfo(req, res) {
    if (!req.xhr || _.isEmpty(req.query)) {
        res.render("cars/carsList", {
            carsList: [],
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

        const query = new Parse.Query("Xe");
        query.matchesQuery('idHangXe', subQuery);

        query.skip(offset);
        query.limit(limit);
        query.descending("createdAt");
        query.include("idLoaiXe");

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
        const xePointer = new Parse.Object("Xe");

        const LoaiXe = Parse.Object.extend("LoaiXe");
        const loaiXePointer = new LoaiXe();

        const loaiXe = req.body.loaiXe;
        const bienSo = req.body.bienSo;
        const chiTiet = req.body.chiTiet;

        const user = req.user;
        if (!user) {
            throw "Yêu cầu đăng nhập";
        }

        if (!loaiXe || !bienSo) {
            throw "Thêm mới thất bại!\n" + "Cần chọn loại xe và nhập biển số xe.";
        }

        loaiXePointer.id = loaiXe;

        const User = Parse.Object.extend("User");
        const userPointer = new User();
        userPointer.id = user.objectId;

        xePointer.set('idLoaiXe', loaiXePointer);
        xePointer.set('idHangXe', userPointer);
        xePointer.set('bienSo', bienSo);
        xePointer.set('chiTiet', chiTiet);
        xePointer.set('trangThai', 'ACTIVED');

        xePointer.save(null, {
                useMasterKey: true
            })
            .then(() => res.send('ok'))
            .catch(error => res.status(400).send(error));
    } catch (error) {
        res.status(400).send(error);
    }
}

function updateCar(req, res) {
    try {
        const bienSo = req.body.bienSo;
        if (!bienSo) {
            throw "Phải nhập biển số cho xe.";
        }

        const queryXe = new Parse.Query("Xe");
        queryXe.equalTo("objectId", req.body.objectId);
        queryXe
            .first()
            .then(xe => {
                //Set value for object
                const loaiXePointer = new Parse.Object("LoaiXe");
                loaiXePointer.id = req.body.loaiXe;
                xe.set("idLoaiXe", loaiXePointer);
                xe.set("bienSo", req.body.bienSo);
                xe.set("chiTiet", req.body.chiTiet);
                xe.set("trangThai", req.body.trangThai);

                //Save Object
                xe
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

function getUICreate(req, res) {
    try {
        const queryLoaiXe = new Parse.Query('LoaiXe');
        queryLoaiXe.ascending('tenLoai');
        queryLoaiXe.select(['objectId', 'tenLoai']);
        queryLoaiXe.find()
            .then(result => {
                res.render("cars/newCar", {
                    layout: "layouts/noneLayout",
                    loaiXe: UTILS.parseObjectArray2JSON(result)
                });
            })
            .catch(error => {
                res.status(400).send(error);
            });
    } catch (error) {
        res.status(400).send(error);
    }
}

function getUIUpdate(req, res) {
    try {
        const queryLoaiXe = new Parse.Query('LoaiXe');
        queryLoaiXe.ascending('tenLoai');
        queryLoaiXe.select(['objectId', 'tenLoai']);

        const queryXe = new Parse.Query("Xe");
        queryXe.equalTo("objectId", req.body.id);

        const promise = [];
        promise.push(queryLoaiXe.find());
        promise.push(queryXe.first()); 

        Promise.all(promise)
            .then((result) => {
                res.render("cars/modifyCar", {
                    layout: "layouts/noneLayout",
                    loaiXe: UTILS.parseObjectArray2JSON(result[0]),
                    car: result[1].toJSON(),
                    carType: req.body.carTypeId
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