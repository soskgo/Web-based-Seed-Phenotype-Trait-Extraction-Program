var express = require("express");
var router = express.Router();
var cv = require("opencv4nodejs");
var path = require("path");
var mysql = require("mysql");
var {
  Vec3,
  xmodules,
  Mat,
  Rect,
  Point2
} = require("opencv4nodejs");
var {
  json
} = require("body-parser");

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "8830",
  database: "mydb",
  multipleStatements: true,
});
connection.connect();

/* GET home page. */
router.get("/:filename", function (req, res, next) {
  var filename = req.params.filename;
  var img = cv.imread("upload/" + filename, cv.IMREAD_COLOR); //이미지 불러오기
  var region = img.getRegion(new cv.Rect(500, 3000, 5500, 1000)); //이미지 자르기
  var splitB = cv.split(region)[0]; //b채널로 분리
  var thresImg = splitB.threshold(220, 255, cv.THRESH_BINARY_INV);
  var contours = thresImg.findContours(cv.RETR_TREE, cv.CHAIN_APPROX_NONE);
  var num = 0; //카운트 변수
  var areaSum = 0; //면적 합계 변수
  var areaAvg = 0; //면적 평균 변수
  var perimterSum = 0; //둘레 합계 변수
  var perimterAvg = 0; //둘레 평균 변수
  var soliditySum = 0; //견고함 합계 변수
  var solidityAvg = 0; //견고함 평균 변수
  var longAxis = 0; //장축 변수
  var shortAxis = 0; //단축 변수

  var seedCount = new Array(); //개수 배열
  var seedArea = new Array(); //면적 배열
  var seedPerimter = new Array(); //둘레 배열
  var seedSolidity = new Array(); //견고함 배열
  var seedLongAxis = new Array(); //장축 배열
  var seedShortAxis = new Array(); //단축 배열

  for (i in contours) {
    if (contours[i].area > 3000 && contours[i].area < 20000) {
      //콩 수 카운트
      num++;
      // 콩 면적
      areaSum += contours[i].area;
      seedArea.push(contours[i].area);
      //콩 둘레
      perimterSum += contours[i].arcLength((close = true));
      seedPerimter.push(contours[i].arcLength((close = true)));
      //콩 견고함
      soliditySum +=
        contours[i].area / contours[i].convexHull((close = true)).area;
      seedSolidity.push(
        contours[i].area / contours[i].convexHull((close = true)).area
      );
      //콩 장축 단축
      var minareaRect = contours[i].minAreaRect();
      if (minareaRect.size.height > minareaRect.size.width) {
        longAxis += minareaRect.size.height;
        seedLongAxis.push(minareaRect.size.height);
        shortAxis += minareaRect.size.width;
        seedShortAxis.push(minareaRect.size.width);
      } else {
        longAxis += minareaRect.size.width;
        seedLongAxis.push(minareaRect.size.width);
        shortAxis += minareaRect.size.height;
        seedShortAxis.push(minareaRect.size.height);
      }
    }
  }
  areaAvg = areaSum / num; //면적 평균 구하기
  perimterAvg = perimterSum / num; //둘레 평균 구하기
  solidityAvg = soliditySum / num; //견고함 평균 구하기

  for (var i = 1; i <= num; i++) {
    seedCount.push(i);
  }

  var seedCountJsonString = JSON.stringify(seedCount);
  var seedAreaJsonString = JSON.stringify(seedArea);
  var seedPerimterJsonString = JSON.stringify(seedPerimter);
  var seedSolidityJsonString = JSON.stringify(seedSolidity);
  var seedLongAxisJsonString = JSON.stringify(seedLongAxis);
  var seedshortAxisJsonString = JSON.stringify(seedShortAxis);

  cv.imwrite("upload/Chagne_" + filename, thresImg); //변경 이미지 저장
  res.render("processing", {
    title: "imageProcessing",
    num: num,
    area: areaAvg.toFixed(4),
    perimter: perimterAvg.toFixed(4),
    solidity: solidityAvg.toFixed(4),
    longAxis: (longAxis / num).toFixed(4),
    shortAxis: (shortAxis / num).toFixed(4),
    path: "/Chagne_" + filename,
    seedCount: seedCountJsonString,
    seedArea: seedAreaJsonString,
    seedPerimter: seedPerimterJsonString,
    seedSolidity: seedSolidityJsonString,
    seedLongAxis: seedLongAxisJsonString,
    seedShortAxis: seedshortAxisJsonString,
  });

  //Database insert
  for (var i = 0; i < num; i++) {
    var insertQuery =
      "INSERT INTO `mydb`.`numericaldata` (`seedCount`, `seedArea`, `seedPerimter`, `seedSolidity`, `seedLongAxis`, `seedShortAxis`) VALUES ('" +
      seedCount[i] +
      "', '" +
      seedArea[i] +
      "', '" +
      seedPerimter[i] +
      "', '" +
      seedSolidity[i] +
      "', '" +
      seedLongAxis[i] +
      "', '" +
      seedShortAxis[i] +
      "')";
    connection.query(insertQuery, function (err, rows, result) {
      if (err) {
        throw err;
      }
    });
  }
});

module.exports = router;