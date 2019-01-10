var express = require("express");
var router = express.Router();
const baseAuth = require("./base/authentication");
const _ = require("lodash");
const UTILS = require('../helpers/UTILS');

router.get("/", baseAuth.ensureAuthenticated, ticketList);
router.get("/booked", baseAuth.ensureAuthenticated, ticketList);
router.get("/cancelled", baseAuth.ensureAuthenticated, ticketCancelledList);
router.post("/cancelled/confirmation", baseAuth.ensureAuthenticated, confirmCancelledTicket);

function ticketList(req, res) {
    if (!req.xhr || _.isEmpty(req.query)) {
        res.render("tickets/ticketList", {
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

        const query = new Parse.Query("Ve");
        query.matchesQuery('hangXe', subQuery);
        query.equalTo('daDat', true);

        query.skip(offset);
        query.limit(limit);
        query.descending("updatedAt");
        query.include(["idTuyen", "idTuyen.idLoTrinh", "idTuyen.idXe", "idTuyen.thoiGianKhoiHanh", "khachHang"]);

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

function ticketCancelledList(req, res) {
    if (!req.xhr || _.isEmpty(req.query)) {
        res.render("tickets/ticketCancelledList", {
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

        const query = new Parse.Query("VeDaHuy");
        query.matchesQuery('hangXe', subQuery);

        query.skip(offset);
        query.limit(limit);
        query.descending("createdAt");
        query.include(["idTuyen", "idTuyen.idLoTrinh", "idTuyen.idXe", "idTuyen.thoiGianKhoiHanh", "khachHang"]);

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

function confirmCancelledTicket(req, res) {
    try {
        const user = req.user;
        if (!user) {
            throw "Require login";
        }

        const query = new Parse.Query('VeDaHuy');
        query.matches('objectId', req.body.id);
        query.first()
            .then(veHuy => {
                veHuy.set('trangThai', 'CONFIRMED');
                veHuy.save(null, {
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