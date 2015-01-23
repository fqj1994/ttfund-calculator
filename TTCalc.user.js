// ==UserScript==
// @name         TTCalc
// @namespace    ttcalc
// @version      2015012305
// @description  Some Automatic Calculator for Tian Tian Fund
// @author       Qijiang Fan
// @include      https://trade.1234567.com.cn/*
// @include      http://fund.eastmoney.com/favor.html
// @include      http://fund.eastmoney.com/f10/*
// @require      http://cdn.staticfile.org/jquery/2.1.1-rc2/jquery.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

$$ = jQuery;

jjjprocessed = {
    '#tb_0_0': false,
    '#tb_0_zs': false,
    'updateguzhi': false,
}

/*
GM_xmlhttpRequest({
    'method': 'get',
    'url': 'http://fund.eastmoney.com/',
    'onload': function(data) {
        console.log(data);
    }
});
*/


$$.each(GM_listValues(), function(key) {
    if (/^jijin_[0-9]{6}$/.test(key) || /^shizhi_[0-9]{6}$/.test(key)) {
  	} else {
	  	GM_deleteValue(key);
  	}
});

console.log(GM_listValues())


function updatesxf(fcode) {
    var newval = parseFloat($$("#shuhui_" + fcode).val());
    GM_setValue('jijin_' + fcode, newval);
}

totalbenefit_all = 0.0;

function workwork(prefix, fff) {
    if ($$(prefix + " thead") && !jjjprocessed[prefix]) {
		$$(prefix + " thead tr").append("<th>卖出手续费</th><th>扣除后收益</th>");
       	jjjprocessed[prefix] = true;
        var total_shouyi = 0;
        $$(prefix + " tbody tr").each(function (idx) {
            var fcode = $$(this).find("a.fcode").html();
            if ($$(this).attr('class') == "hideTr hide") {
                return;
            }
            var val = GM_getValue("jijin_" + fcode);
            if (val === undefined) {
            	val = 999.0;
            }
            var original_shouyi = parseFloat($$(this).find($$("td span"))[4].innerHTML);
            var total_value = parseFloat($$(this).find($$("td span"))[3].innerHTML);
            var real_shouyi = original_shouyi - total_value * val / 100.0;
            GM_setValue("shizhi_" + fcode, total_value);
            GM_setValue("jijin_" + fcode, val);
            $$(this).append('<td><input type="text" value="' + val + '" id="shuhui_' + fcode +'" size=1/></td>');
            $$("#shuhui_" + fcode).change(function() { updatesxf(fcode) });
            $$(this).append('<td><span id="shouyi_' + fcode + '">' + real_shouyi.toFixed(2) + '(' +  (real_shouyi * 100.0 / (total_value - original_shouyi)).toFixed(2) +'%)</span></td>');
            total_shouyi += parseFloat(real_shouyi.toFixed(2));
        });
        $$.each(fff, function(idx) {
            $$(fff[idx]).html($$(fff[idx]).html() + "(" +  total_shouyi.toFixed(2) + ")")
        });
        totalbenefit_all += total_shouyi;
    }
}

function ttcalcjijin() {
    workwork("#tb_0_0", ["#pft0", "#fund_benifit"]);
    workwork("#tb_0_zs", ["#zs_benifit"]);
    $$("#all_value").html($$("#all_value").html().split("(")[0] + "(" + "++" + totalbenefit_all  + ")");
}

console.log("function def end")

function updateguzhi() {
    if (!jjjprocessed['updateguzhi']) {
        $$("#kf_m_0 thead tr th").each(function(idx) {
            if (idx == 3) $$(this).after("<th id=\"guzhi_zengzhang\">增长值</th>");
            if (idx == 7) $$(this).after("<th id=\"jingzhi_zengzhang\">增长值</th>");
        });
        jjjprocessed['updateguzhi'] = true;
    }
    $$("#guzhi_zengzhang").html('0')
    $$("#jingzhi_zengzhang").html('0')
    $$("#kf_m_0 tbody tr").each(function(idx) {
        var fcode = $$(this).find($$(".jc a")).toArray()[0].innerHTML;
        var value_price = GM_getValue("shizhi_" + fcode);
        if (value_price == undefined) value_price = 0.0;
        if (($$(this).find($$("#guzhizengzhang_" + fcode))).toArray().length == 0) {
            $$(this).find($$("td")).each(function(idx) {
                if (idx == 3) $$(this).after('<td id="guzhizengzhang_' + fcode + '"></td>');
                if (idx == 7) $$(this).after('<td id="jingzhizengzhang_' + fcode + '"></td>');
            });
        }
        var guzhi_zengzhanglv, jingzhi_zengzhanglv;
        $$(this).find($$("td")).each(function(idx) {
            if (idx == 3) guzhi_zengzhanglv = parseFloat($$(this).html().split('%')[0]);
            if (idx == 8) jingzhi_zengzhanglv = parseFloat($$(this).html().split('%')[0]);
        });
        $$(this).find($$("#guzhizengzhang_" + fcode)).html((value_price * guzhi_zengzhanglv / 100.0).toFixed(2));
        $$(this).find($$("#jingzhizengzhang_" + fcode)).html((value_price * jingzhi_zengzhanglv / 100.0).toFixed(2));
        $$("#guzhi_zengzhang").html((parseFloat($$("#guzhi_zengzhang").html()) + (value_price * guzhi_zengzhanglv / 100.0)).toFixed(2));
        $$("#jingzhi_zengzhang").html((parseFloat($$("#jingzhi_zengzhang").html()) + (value_price * jingzhi_zengzhanglv / 100.0)).toFixed(2));
    });
    $$("#guzhi_zengzhang").html("增长值(" + $$("#guzhi_zengzhang").html() + ")")
    $$("#jingzhi_zengzhang").html("增长值(" + $$("#jingzhi_zengzhang").html() + ")")
}

if (window.location.pathname.search(/\/MyAssets\/Default/i) == 0) {
	setInterval(ttcalcjijin, 2000);
} else if (window.location.pathname.search(/\/favor\.html/i) == 0) {
    updateguzhi();
	setInterval(updateguzhi, 2000);
} else if (window.location.pathname.search(/\/f10\/jjfl_.*/i) == 0) {
    alert(1);
}
    
console.log("process end")