var fs = require("fs");
var uuid = require("uuid");
var convertGISCoordinate = (function(){
  var proj4 = require("proj4");
  proj4.defs([
    [
      "EPSG:2954",
      "+proj=sterea +lat_0=47.25 +lon_0=-63 +k=0.999912 +x_0=400000 +y_0=800000 +ellps=GRS80 +units=m +no_defs",
    ],
    ["EPSG:4269", "+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs "],
    ["EPSG:4326", "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs "],
    ["EPSG:3087","+proj=aea +lat_1=24 +lat_2=31.5 +lat_0=24 +lon_0=-84 +x_0=400000 +y_0=0 +ellps=GRS80 +units=m +no_defs"],
    ["EPSG:3086","+proj=aea +lat_1=24 +lat_2=31.5 +lat_0=24 +lon_0=-84 +x_0=400000 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"],
    ["EPSG:26915","+proj=utm +zone=15 +datum=NAD83 +units=m +no_defs +type=crs"],
    ["EPSG:26918","+proj=utm +zone=18 +datum=NAD83 +units=m +no_defs +type=crs"],
  ]);
   return function (epsgID) {
        var toEPSG = "EPSG:4326";
        var fromEPSG = "EPSG:" + epsgID;
        if (fromEPSG === toEPSG) {
          return function (coord) {
            return coord;
          }
        }

        var fromPrj = proj4(fromEPSG);
        var toPrj = proj4(toEPSG);
        return function (coord) {
          return proj4(fromPrj, toPrj, coord);
        };
      }
}
)();


var convertAmenityToExcel = (function(){
  var excelLib = require('node-xlsx');
  return function(geoCode){
    var coordinateConverter =  convertGISCoordinate(geoCode);
    return function(originalFileDir,toFileDir, originalFileName, toFileName, parkId, parkName, customizedType, customizedName){
        var convertedAmenities = (JSON.parse(fs.readFileSync(originalFileDir + originalFileName)).features.map(function(eachFeature){
        return {
          amenityType:  eachFeature.attributes.Type || eachFeature.attributes[customizedType] , 
          amenityName:  eachFeature.attributes.Name || eachFeature.attributes[customizedName] ,
          coord: coordinateConverter([eachFeature.geometry.x,eachFeature.geometry.y])
        }  
      }));
  
      var amenityContent = convertedAmenities.map(function(eachElement){
        return [parkId, parkName, eachElement.amenityName, eachElement.amenityType.replace(/\s/g, ''), "", "", eachElement.coord[1], eachElement.coord[0]];
      });
      fs.writeFileSync(toFileDir +  toFileName, excelLib.build( [
        {
          name: 'Amenity',
          data: [['Park ID', 'Park Name', 'Name', 'Type', 'Status', 'Accessibility' , 'Latitude', 'Longitude']].concat(amenityContent)
        }
      ]));
       }
    };

})();

var convertGISJson = (function () { 


    return function (sourceDir, toDir, parkNameMapping,defaultParkId) {
      convert = function (
        epsgId,
        fileName,
        coordinateMapFunc,
        importParkIdMapFunc,
        nameFunc,
        shapeId,
        shapedSytleId,
        featureType,
        preFunc
      ) {
        var coordinateConvert = convertGISCoordinate(epsgId);
        fs.writeFileSync(
          toDir + "converted_" + fileName,
          JSON.stringify(
            (preFunc || ((a) => a))(
              JSON.parse(fs.readFileSync(sourceDir + fileName)).features
            ).map(function (eachFeature) {
              var objId = uuid.v4();
              return {
                importParkID: parkNameMapping[importParkIdMapFunc(eachFeature)] || defaultParkId,
                importParkName: importParkIdMapFunc(eachFeature),
                elementTypeID: 3,
                objectID: objId,
                properties: {
                  id: objId,
                  name: nameFunc(eachFeature),
                  shapeId: shapeId,
                  shapeStyleId: shapedSytleId,
                },
                geoData: {
                  type: featureType,
                  coordinates: coordinateMapFunc(
                    eachFeature,
                    coordinateConvert
                  ),
                },
              };
            })
          )
        );
      };

    return {
      convertPolygon: (
        epsgId,
        fileName,
        coordinateName,
        attributeName,
        parkName,
        name,
        shapeId,
        shapedSytleId
      ) => {
        return convert(
          epsgId,
          fileName,
          (eachFeature, coordinateConvert) =>
            eachFeature.geometry[coordinateName].map((each) =>
              each.map((eachCoordinate) => coordinateConvert(eachCoordinate))
            ),
          (eachFeature) => eachFeature[attributeName][parkName],
          (eachFeature) => eachFeature[attributeName][name],
          shapeId,
          shapedSytleId,
          "Polygon"
        );
      },
      convertGeneral: convert,
      convertLineString: (
        epsgId,
        fileName,
        coordinateName,
        attributeName,
        parkName,
        name,
        shapeId,
        shapedSytleId,
        prefunc
      ) => {
        return convert(
          epsgId,
          fileName,
          (eachFeature, coordinateConvert) =>
            eachFeature.coordinates.map((eachPoint) =>
              coordinateConvert(eachPoint)
            ),
          (eachFeature) => eachFeature.attributes[parkName],
          (eachFeature) =>
            eachFeature.attributes[name] +
            (eachFeature.ID ? "" : ""),
          shapeId || "trail",
          shapedSytleId || "generalTrail",
          "LineString",
          (prefunc || ((features) =>
            features.flatMap((eachFeature) => {
              var counter = 0;
              var coordinateElem = (eachFeature.geometry.type === "LineString") ? [eachFeature.geometry[coordinateName]] : eachFeature.geometry[coordinateName];
              return coordinateElem.map((each) => {
                return {
                  ID: counter++,
                  attributes: eachFeature[attributeName],
                  coordinates: each,
                };
              });
            })))
        );
      },
    };
  };
})();

module.exports = {
  convertGISJson,convertGISCoordinate,convertAmenityToExcel,fs,uuid
};
