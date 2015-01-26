// ==UserScript==
// @name         TTCalc
// @namespace    ttcalc
// @version      2015012613
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

$$.each(GM_listValues(), function(idx, key) {
    if (/^feilv_[0-9]{6}$/.test(key) || /^shizhi_[0-9]{6}$/.test(key) || /^fene_[0-9]{6}$/.test(key) || /^hidezero$/.test(key)) {
        console.log(key, GM_getValue(key));
  	} else {
	  	GM_deleteValue(key);
  	}
});

hidezero = GM_getValue("hidezero");
if (hidezero == undefined) { hidezero = false; GM_setValue("hidezero", false); }


totalbenefit_all = 0.0;

function cleardata() {
    $$.each(GM_listValues(), function(idx, key) {
        GM_deleteValue(key);
    });
    window.location = '';
}

function workwork(prefix, fff) {
    if ($$(prefix + " thead") && !jjjprocessed[prefix]) {
		$$(prefix + " thead tr").append("<th>卖出手续费<br/>(<a class=\"qingchusj\">清除数据</a>)</th><th>扣除后收益</th>");
       	jjjprocessed[prefix] = true;
        var total_shouyi = 0;
        $$(prefix + " tbody tr").each(function (idx) {
            var fcode = $$(this).find("a.fcode").html();
            if ($$(this).attr('class') == "hideTr hide") {
                return;
            }
            var oval = GM_getValue("feilv_" + fcode);
            var val = 0.0;
            if (oval === undefined) {
            	val = 0.0
            } else {
                val = oval[0][1];
            }
            var original_shouyi = parseFloat($$(this).find($$("td span"))[4].innerHTML);
            var total_value = parseFloat($$(this).find($$("td span"))[3].innerHTML);
            var real_shouyi = original_shouyi - total_value * val / 100.0;
            GM_setValue("shizhi_" + fcode, total_value);
            var fene = $$(this).find($$("td span"))[2].innerHTML.split('&nbsp;/&nbsp;');
            GM_setValue("fene_" + fcode, [parseFloat(fene[0]), parseFloat(fene[1])]);
            if (oval !== undefined) {
                $$(this).append('<td><select style="width: 75px;" id="shuhui_' + fcode + '"></select>');
                $$.each(oval, function(idx) {
                    var apdxstr = '';
                    if (idx == 0) apdxstr = ' selected=selected';
                    $$("#shuhui_" + fcode).append('<option value="' + oval[idx][1] + '"' + apdxstr + '>' + oval[idx][0] + '</option>');
                });
                $$("#shuhui_" + fcode).change(function() {
                    var feilvs = $$(this).find($$("option:selected")).text();
                    var feilvv = parseFloat($$(this).find($$("option:selected")).val());
                    oval[0] = [feilvs, feilvv];
                    GM_setValue("feilv_" + fcode, oval);
                });
            } else {
                $$(this).append('<td><a target="_blank" href="http://fund.eastmoney.com/f10/jjfl_' + fcode + '.html">点击获取</a></td>')
            }
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
    $$("#all_value").html($$("#all_value").html().split("(")[0] + "(" + (totalbenefit_all >= 0 ? "+": "") + totalbenefit_all.toFixed(2)  + ")");
    $$(".qingchusj").click(cleardata);
}

function toFixed2(x) {
    return x.toFixed(2)
}

console.log("function def end")

guzhi_changing = {}
guzhi_last = {}

function updateguzhi() {
    if (!jjjprocessed['updateguzhi']) {
        $$("#kf_m_0 thead tr th").each(function(idx) {
            if (idx == 0) {
                $$(this).html($$(this).html() + '<input type="button" id="togglezero" value="隐藏显示0"/>');
                $$("#togglezero").click(function() { 
                    var totoggle = $$("#kf_m_0 tbody td").filter(function() { return this.innerHTML == '0/0';}).parent();
                    if (hidezero) totoggle.show();
                    else totoggle.hide();
                    hidezero = hidezero ? false : true;
                    GM_setValue("hidezero", hidezero);
                });
            }
            if (idx == 3) $$(this).after("<th id=\"guzhi_zengzhang\">增长值</th>");
            if (idx == 7) $$(this).after("<th id=\"jingzhi_zengzhang\">增长值</th>");
        });
        jjjprocessed['updateguzhi'] = true;
    }
    $$("#guzhi_zengzhang").html('0');
    $$("#jingzhi_zengzhang").html('0');
    var v_sum_guzhi = [0, 0], v_sum_jingzhi = [0, 0];
    $$("#kf_m_0 tbody tr").each(function(idx) {
        var fcode = $$(this).find($$(".jc a")).toArray()[0].innerHTML;
        var value_price = GM_getValue("fene_" + fcode);
        if (value_price == undefined) value_price = [0.0, 0.0];
        if (($$(this).find($$("#guzhizengzhang_" + fcode))).toArray().length == 0) {
            $$(this).find($$("td")).each(function(idx) {
                if (idx == 3) $$(this).after('<td id="guzhizengzhang_' + fcode + '"></td>');
                if (idx == 7) $$(this).after('<td id="jingzhizengzhang_' + fcode + '"></td>');
            });
        }
        var v_jingzhigusuan, v_zuixinjingzhi, v_shangqijingzhi, v_zuixin_date;
        var guzhidate;
        $$(this).find($$("td")).each(function(idx) {
            if (idx == 2) v_jingzhigusuan = parseFloat($$(this).html());
            if (idx == 5) { 
                v_zuixinjingzhi = parseFloat($$(this).html()); 
                v_zuixin_date = $$(this).find($$("font")).text();
            }
            if (idx == 10) v_shangqijingzhi = parseFloat($$(this).html());
        });
        var v_guzhi_zengzhang = [0, 0];
        var date_utc_str = ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "-" + ("0" + (new Date().getUTCDate())).slice(-2);
        if (v_jingzhigusuan != guzhi_last[fcode] && guzhi_last[fcode] != undefined) guzhi_changing[fcode] = true; // guzhi_changing is for QDII
        if (date_utc_str != v_zuixin_date || guzhi_changing[fcode]) { // (a new day || QDII)
        	v_guzhi_zengzhang = [parseFloat(((v_jingzhigusuan - v_zuixinjingzhi) * (value_price[0])).toFixed(2))
        						,parseFloat(((v_jingzhigusuan - v_zuixinjingzhi) * (value_price[1])).toFixed(2))];
        } else {
            v_guzhi_zengzhang = [parseFloat(((v_jingzhigusuan - v_shangqijingzhi) * (value_price[0])).toFixed(2))
        					  ,parseFloat(((v_jingzhigusuan - v_shangqijingzhi) * (value_price[1])).toFixed(2))];
        }
        guzhi_last[fcode] = v_jingzhigusuan;
        var v_jingzhi_zengzhang = [parseFloat(((v_zuixinjingzhi - v_shangqijingzhi) * (value_price[0])).toFixed(2))
                                  ,parseFloat(((v_zuixinjingzhi - v_shangqijingzhi) * (value_price[1])).toFixed(2))];
        $$(this).find($$("#guzhizengzhang_" + fcode)).html(v_guzhi_zengzhang.join('/'));
        $$(this).find($$("#jingzhizengzhang_" + fcode)).html(v_jingzhi_zengzhang.join('/'));
        v_sum_guzhi[0] += v_guzhi_zengzhang[0];
        v_sum_guzhi[1] += v_guzhi_zengzhang[1];
        v_sum_jingzhi[0] += v_jingzhi_zengzhang[0];
        v_sum_jingzhi[1] += v_jingzhi_zengzhang[1];
        if (($$("#guzhizengzhang_" + fcode).text() == "0/0" || $$("#jingzhizengzhang_" + fcode).text() == "0/0") && hidezero) {
            $$(this).hide();
        }
    });
    $$("#guzhi_zengzhang").html("增长值(" + v_sum_guzhi.map(toFixed2).join('/') + ")")
    $$("#jingzhi_zengzhang").html("增长值(" + v_sum_jingzhi.map(toFixed2).join('/') + ")")
}

function parsesxf(fcode) {
    $$(".w790").each(function(idx) {
        if ($$(this).html().indexOf("赎回费率") != -1 && $$(this).html().indexOf("适用金额") != -1) {
            var feilv = [["请选择赎回费率", NaN]];
            var chosen_feilv = undefined;
            if (GM_getValue("feilv_" + fcode) != undefined) {
                chosen_feilv = GM_getValue("feilv_" + fcode)[0];
            }
            var chosen_feilv_valid = false;
            $$(this).find($$("tbody tr")).each(function(idx) {
                var feilvdesc = $$(this).text().replace(/-*/i, '');
                var feilvv = parseFloat($$(this).find($$("td")).last().text().split('%')[0])
                feilvdesc = feilvv + "% (" + feilvdesc + ")";
                feilv.push([feilvdesc, feilvv]);
                if (chosen_feilv == [feilvdesc, feilvv]) {
                    chosen_feilv_valid = true;
                }
            });
            if (chosen_feilv_valid) {
                feilv[0] = chosen_feilv;
            }
            GM_setValue("feilv_" + fcode, feilv);
        }
    });
}

if (window.location.pathname.search(/\/MyAssets\/Default/i) == 0) {
    $$.each(GM_listValues(), function(idx, key) {
        if (/^shizhi_[0-9]{6}$/.test(key) || /^fene_[0-9]{6}$/.test(key)) {
            GM_deleteValue(key);
        }
    });
    $$("#zspro span.alinks").hide();
	setInterval(ttcalcjijin, 2000);
} else if (window.location.pathname.search(/\/favor\.html/i) == 0) {
    updateguzhi();
	setInterval(updateguzhi, 2000);
} else if (window.location.pathname.search(/\/f10\/jjfl_.*/i) == 0) {
    var fcode = window.location.pathname.split('_')[1].split('.')[0];
    parsesxf(fcode);
}
    
console.log("process end")
