// ==UserScript==
// @name         TTCalc
// @namespace    ttcalc
// @version      2015031615
// @description  Some Automatic Calculator for Tian Tian Fund
// @author       Qijiang Fan
// @include      https://trade.1234567.com.cn/*
// @include      https://trade2.1234567.com.cn/*
// @include      http://fund.eastmoney.com/favor.html
// @include      http://fund.eastmoney.com/favor/
// @include      http://fund.eastmoney.com/f10/*
// @include      https://trade.1234567.com.cn/Query/bill*
// @include      https://trade2.1234567.com.cn/Query/bill*
// @require      http://cdn.staticfile.org/jquery/2.1.1-rc2/jquery.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

features = {
    estimate_favor: true,
    deduct_fund_charge: true,
    monthly_report: true
}

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
        //console.log(key, GM_getValue(key));
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
    if ($$(prefix + " thead").text().indexOf("基金代码") != -1 && !jjjprocessed[prefix]) {
		$$(prefix + " thead tr").append("<th>卖出手续费<br/>(<a class=\"qingchusj\">清除数据</a>)</th><th>扣除后收益</th>");
       	jjjprocessed[prefix] = true;
        var total_shouyi = 0;
        $$(prefix + " tbody tr").each(function (idx) {
            var fcode = $$(this).find("a.fcode").html();
            if ($$(this).attr('class') == "hideTr hide") {
                return;
            }
            
            var original_shouyi = parseFloat($$(this).find($$("td span"))[4].innerHTML);
            var total_value = parseFloat($$(this).find($$("td span"))[3].innerHTML);
            var real_shouyi = original_shouyi;
            GM_setValue("shizhi_" + fcode, total_value);
            var fene = $$(this).find($$("td span"))[2].innerHTML.split('&nbsp;/&nbsp;');
            GM_setValue("fene_" + fcode, [parseFloat(fene[0]), parseFloat(fene[1])]);
            var oval = GM_getValue("feilv_" + fcode);
            var op = function(tthis) {
                var oval = GM_getValue("feilv_" + fcode);
                var val = 0.0;
                if (oval === undefined) {
                    val = 0.0
                } else {
                    val = oval[0][1];
                }
                real_shouyi = original_shouyi - total_value * val / 100.0;
                $$(tthis).append('<td><select style="width: 75px;" id="shuhui_' + fcode + '"></select>');
                $$.each(oval, function(idx) {
                    var apdxstr = '';
                    if (idx == 0) apdxstr = ' selected=selected';
                    $$("#shuhui_" + fcode).append('<option value="' + oval[idx][1] + '"' + apdxstr + '>' + oval[idx][0] + '</option>');
                });
                $$("#shuhui_" + fcode).change(function() {
                    var feilvs = $$(tthis).find($$("option:selected")).text();
                    var feilvv = parseFloat($$(this).find($$("option:selected")).val());
                    oval[0] = [feilvs, feilvv];
                    GM_setValue("feilv_" + fcode, oval);
                });
                $$(tthis).append('<td><span id="shouyi_' + fcode + '">' + real_shouyi.toFixed(2) + '(' +  (real_shouyi * 100.0 / (total_value - original_shouyi)).toFixed(2) +'%)</span></td>');
            }
            if (oval == undefined) {
                var tthis = this;
                GM_xmlhttpRequest({method: 'get', url: 'http://fund.eastmoney.com/f10/jjfl_' + fcode + '.html',
                                   onload: function(data) {
                                       var html = data.responseText;
                                       parsesxf(html, fcode);
                                       op(tthis);
                                   }});
            } else op(this);
            $$("#shuhui_" + fcode).change(function() { updatesxf(fcode) });
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
    var all_sxf = parseFloat($$("#fund_benifit").html().split('(')[0]) - parseFloat($$("#fund_benifit").html().split('(')[1].split(')')[0]);
    all_sxf += (parseFloat($$("#zs_benifit").html().split('(')[0]) - parseFloat($$("#zs_benifit").html().split('(')[1].split(')')[0]));
    $$("#all_value").html($$("#all_value").html().split("(")[0] + "(" + (parseFloat($$("#all_value").html().split("(")[0]) - all_sxf).toFixed(2) + "," + (totalbenefit_all >= 0 ? "+": "") + totalbenefit_all.toFixed(2)  + ")");
    $$(".qingchusj").click(cleardata);
}

function toFixed2(x) {
    return x.toFixed(2)
}

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
            if (idx == 1) $$(this).hide();
            if (idx == 3) $$(this).after("<th id=\"guzhi_zengzhang\">增长值</th>");
            if (idx == 7) $$(this).after("<th id=\"jingzhi_zengzhang\">增长值</th>");
        });
        jjjprocessed['updateguzhi'] = true;
    }
    $$(".xglj").hide();
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

function parsesxf(doc, fcode) {
    $$(doc).find(".w790").each(function(idx) {
        if ($$(this).html().indexOf("赎回费率") != -1 && $$(this).html().indexOf("适用金额") != -1) {
            var feilv = [["请选择赎回费率", NaN]];
            var chosen_feilv = undefined;
            if (GM_getValue("feilv_" + fcode) != undefined) {
                chosen_feilv = GM_getValue("feilv_" + fcode)[0];
            }
            var chosen_feilv_valid = false;
            $$(this).find("tbody tr").each(function(idx) {
                var feilvdesc = $$(this).text().replace(/-*/i, '');
                var feilvv = parseFloat($$(this).find("td").last().text().split('%')[0])
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



function get_jingzhi_history(jjcode, year, month) {
    days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    lishi_jingzhi[jjcode] = {};
    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) days[2] = 29;
    sdate = year + "-" + month + "-01";
    edate = year + "-" + month + "-" + days[parseInt(month)];
    GM_xmlhttpRequest({
        method:"GET",
        url:"http://fund.eastmoney.com/f10/F10DataApi.aspx?type=lsjz&code=" + jjcode + "&page=1&per=50&sdate=" + sdate + "&edate=" + edate + "&rt=" + Math.random(),
        onload: function(data) {
            eval(data.response);
            $$(apidata.content).find("tbody tr").each(function(idx) {
                var jzdate = $$(this).find("td")[0].innerHTML;
                var jzz = parseFloat($$(this).find("td")[1].innerHTML);
                if (idx == 0) lishi_jingzhi[jjcode].last = jzz;
                lishi_jingzhi[jjcode][jzdate] = jzz;
                lishi_jingzhi[jjcode].first = jzz;
            });
            lishi_jingzhi[jjcode].done = true;
        }
    });
}

function bill_calc() {
    chiyou = {};
    lishi_jingzhi = {}
    bill_jjid2name = {}
    $$("#bill_calc").val("正在处理月末持仓");
    $$("#billholdtable").find($$("tr")).each(function(idx) {
        if (idx > 1) {
            var idid = $$(this).find($$("td"))[0].innerHTML;
            if (idid.length < 6) return;        
            chiyou[idid] = parseFloat($$(this).find($$("td"))[5].innerHTML);
            bill_jjid2name[idid] = $$(this).find($$("td"))[1].innerHTML;
        }
    });
    $$("#bill_calc").val("正在根据交易记录推导月初持仓");
    $$("#billtradetable").find($$("tr")).each(function(idx) {
        if (idx > 0) {
            var idid = $$(this).find($$("td"))[1].innerHTML;
            var tradetype = $$(this).find($$("td"))[3].innerHTML;
            var fene = parseFloat($$(this).find($$("td"))[5].innerHTML);
            if (chiyou[idid] == undefined) chiyou[idid] = 0.0;
            if (tradetype == "买基金确认" || tradetype == "强行调增" || tradetype == "转换转入确认") {
                chiyou[idid] -= fene;
            } else if (tradetype == "卖基金确认" || tradetype == "转换确认") {
                chiyou[idid] += fene;
            } else if (tradetype == "活期宝充值" || tradetype == "普通取现" || tradetype == "卖基金到活期宝") {
                delete chiyou[idid];
            } else {
                console.log("未知交易类型：" + tradetype + "。忽略。");
            }
            bill_jjid2name[idid] = $$(this).find($$("td"))[2].innerHTML;
        }
    });
    $$("#bill_calc").val("正在获取历史净值");
    for (var jjcode in chiyou) {
        lishi_jingzhi[jjcode] = {};
        get_jingzhi_history(jjcode,$$("#ctl00_body_ddYear").val(),$$("#ctl00_body_bill_date").val());
    }
    setTimeout(after_check_lsjz_status, 1000);
}

function after_check_lsjz_status() {
    for (var jjcode in lishi_jingzhi) {
        if (lishi_jingzhi[jjcode].done != true) {
            setTimeout(after_check_lsjz_status, 1000);
            return;
        }
    }
    var chengben = {}
    $$("<div class=\"bill_table\"><table id=\"analysis\" class=\"b1\"><thead><tr><th>日期</th><th>基金</th><th>份额</th><th>净值</th><th>价值</th><th>增长</th></tr></thead><tbody></tbody></table></div>").insertAfter(".bill_person");
    for (var jjcode in lishi_jingzhi) {
        var tfene = chiyou[jjcode];
        var tjingzhi = lishi_jingzhi[jjcode].first;
        chengben[jjcode] = tfene * tjingzhi;
        $$("#analysis tbody").append("<tr><td>月初</td><td>" + jjcode + "(" + bill_jjid2name[jjcode] + ")" + "</td><td>" + tfene.toFixed(2) + "</td><td>" + tjingzhi + "</td><td>" + (tfene * tjingzhi).toFixed(2) + "</td><td>" + (tfene * tjingzhi - chengben[jjcode]).toFixed(2) + "</td></tr>");
    }
    console.log(lishi_jingzhi);
    $$($$("#billtradetable").find($$("tr")).get().reverse()).each(function(idx) {
        if ($$(this).find($$("td"))[1]) {
            var idid = $$(this).find($$("td"))[1].innerHTML;
            var tradetype = $$(this).find($$("td"))[3].innerHTML;
            var fene = parseFloat($$(this).find($$("td"))[5].innerHTML);
            if (chiyou[idid] == undefined) return;
            if (tradetype == "买基金确认" || tradetype == "强行调增" || tradetype == "转换转入确认") {
                chiyou[idid] += fene;
                chengben[idid] += parseFloat($$(this).find($$("td"))[6].innerHTML);
            } else if (tradetype == "卖基金确认" || tradetype == "转换确认") {
                chiyou[idid] -= fene;
                chengben[idid] -= parseFloat($$(this).find($$("td"))[6].innerHTML);
            } else {
                return;
            }
            var tfene = chiyou[idid];
            var tjingzhi = parseFloat($$(this).find($$("td"))[8].innerHTML);
            if (tjingzhi == 0.0) {
                var tjingzhi = lishi_jingzhi[idid][$$(this).find($$("td"))[0].innerHTML];
            }
            $$("#analysis tbody").append("<tr><td>" + $$(this).find($$("td"))[0].innerHTML + "</td><td>" + idid + "(" + bill_jjid2name[idid] + ")" + "</td><td>" + tfene.toFixed(2) + "</td><td>" + tjingzhi + "</td><td>" + (tfene * tjingzhi).toFixed(2) + "</td><td>" + (tfene * tjingzhi - chengben[idid]).toFixed(2) + "</td></tr>");
        }
    });
    for (var jjcode in lishi_jingzhi) {
        var tfene = chiyou[jjcode];
        var tjingzhi = lishi_jingzhi[jjcode].last;
        $$("#analysis tbody").append("<tr><td>月底/当前</td><td>" + jjcode + "(" + bill_jjid2name[jjcode] + ")" + "</td><td>" + tfene.toFixed(2) + "</td><td>" + tjingzhi + "</td><td>" + (tfene * tjingzhi).toFixed(2) + "</td><td>" + (tfene * tjingzhi - chengben[jjcode]).toFixed(2) + "</td></tr>");
    }
    var zongji = 0.0;
    var zongchengben = 0.0;
    for (var jjcode in lishi_jingzhi) {
        zongji += chiyou[jjcode] * lishi_jingzhi[jjcode].last;
        zongchengben += chengben[jjcode];
    }
    $$("#analysis tbody").append("<tr><td>月底/当前</td><td>总计</td><td></td><td></td><td>" + zongji.toFixed(2) + "</td><td>" + (zongji - zongchengben).toFixed(2) + "</td></tr>");
    $$("#bill_calc").val("计算结束（点击重算）").prop('disabled', false);
}

if (window.location.pathname.search(/\/+MyAssets\/Default/i) == 0 && features.deduct_fund_charge	) {
    $$.each(GM_listValues(), function(idx, key) {
        if (/^shizhi_[0-9]{6}$/.test(key) || /^fene_[0-9]{6}$/.test(key)) {
            GM_deleteValue(key);
        }
    });
    $$("#zspro span.alinks").hide();
	setInterval(ttcalcjijin, 2000);
} else if (window.location.pathname.search(/\/favor(\.html|\/)/i) == 0 && features.estimate_favor) {
    updateguzhi();
	setInterval(updateguzhi, 2000);
} else if (window.location.pathname.search(/\/f10\/jjfl_.*/i) == 0) {
    var fcode = window.location.pathname.split('_')[1].split('.')[0];
    parsesxf($$("html").html(), fcode);
} else if (window.location.pathname.search(/\/query\/bill.*/i) == 0 && features.monthly_report) {
    $$(".bill_person").html($$(".bill_person").html() + "<input type=\"button\" id=\"bill_calc\" value=\"所有数据加载完成后点此计算\" />");
    $$("#bill_calc").click(function() { $$("#analysis").remove(); $$("#bill_calc").prop("disabled", true); bill_calc(); });
}
