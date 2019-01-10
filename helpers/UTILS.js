const _ = require('lodash');
const UTILS = {};

UTILS.callAPI = function(apiName, paramsData) {
    return Parse.Cloud.run(apiName, paramsData);
};

UTILS.createPointerTo = (ClassName, fieldName, fieldValue) => {
    const Query = new Parse.Query(ClassName);
    Query.equalTo(fieldName, fieldValue);

    return Query.first().then((result) => {

        if (result) {
            const ParseObject = Parse.Object.extend(ClassName);
            return ParseObject.createWithoutData(result.id);
        } else {
            let CreatedObject = new Parse.Object(ClassName);
            CreatedObject.set(fieldName, fieldValue);
            return CreatedObject.save().then((realObject) => {
                return realObject.createWithoutData(result.id);
            });
        }
    });
};

UTILS.createBlankPointerTo = (ClassName, objectId) => {
    const ParseObject = Parse.Object.extend(ClassName);
    return ParseObject.createWithoutData(objectId);
};

UTILS.pageCalc = (pageNumber, perPage) => {
    if (!pageNumber)
        return null;
    perPage = perPage || 10;
    const offset = (pageNumber - 1) * perPage;
    return { offset, limit: perPage };
};

UTILS.buildPointerQuery = (className = 'Product', selectedField = []) => {
    const query = new Parse.Query(className);

    if (!_.isEmpty(selectedField)) {
        query.select(selectedField);
    }

    return query;
};

UTILS.parseObjectArray2JSON = (parseObjectArray = []) => {
    return parseObjectArray.map((indexVal) => {
        return indexVal.toJSON();
    });
};

UTILS.fetchObject = (ClassName, fieldName, fieldValue, includeField = []) => {
    const Query = new Parse.Query(ClassName);
    Query.equalTo(fieldName, fieldValue);


    if (!_.isEmpty(includeField)) {
        Query.include(includeField);
    }

    return Query.first({useMasterKey: true});
};

UTILS.setIDSeat = (index) => {
    if (index < 10) {
        return "0" + index.toString();
    }
    else {
        return index.toString();
    }
}

module.exports = UTILS;