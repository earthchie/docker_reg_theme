$('.step').click(function (e) {
    e.preventDefault();

    goToStep($(this).index());

    return false;
});

$('[data-to-step]').click(function (e) {
    e.preventDefault();

    goToStep($(this).data('to-step') - 1);

    return false;
});



$('#step1 form').submit(function (e) {
    e.preventDefault();

    var rsvn = {};
    $(this).find('[name]').each(function () {
        rsvn[$(this).attr('name')] = $(this).val();
    });
    rsvn.status = 'รอการชำระเงิน'; // รอการชำระเงิน, รอการตรวจสอบ, เสร็จสมบูรณ์

    var $btn = $(this).find('button');
    $btn.attr('disabled', 'disabled');
    $btn.text('รอสักครู่...');

    if (rsvn.seats > 0) {
        
        // mockup
        UIkit.notify('ลงทะเบียนจองเรียบร้อยแล้ว', 'success');
        goToStep(1);

        $btn.removeAttr('disabled');
        $btn.text('จอง');
        
    } else {
        UIkit.notify('กรุณาระบุจำนวนที่นั่งที่ท่านต้องการจอง', 'danger');
    }

    return false;
});

$('#step3 form').submit(function (e) {
    e.preventDefault();

    return false;
});

$('[name="seats"]').change(function () {
    var max_surplus = 3;
    var remains = parseInt($('#remains').data('remains')) - parseInt($(this).val());

    var surplus = remains * -1;

    if (remains <= 0) {
        if (remains < 0) $('#step1 button').attr('disabled', 'disabled');

        remains = 0;


    } else {
        $('#step1 button').removeAttr('disabled');
    }

    $('#remains').html(remains);

    if (surplus > 0) {

        if (surplus <= max_surplus) {
            $('#extras').text('เพิ่มที่นั่งให้เป็นกรณีพิเศษ ' + surplus + ' ที่นั่ง');
            $('#extras').css({
                'color': 'green',
                'display': 'block'
            });
            $('#step1 button').removeAttr('disabled');
        } else {
            $('#extras').text('ขออภัย ไม่มีที่นั่งเหลือเพียงพอ');
            $('#extras').css({
                'color': 'red',
                'display': 'block'
            });
            $('#step1 button').attr('disabled', 'disabled');
        }

    } else {
        $('#extras').hide();
    }

    var subtotal = price_with_vat * $(this).val();
    subtotal = subtotal.toString().replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });

    $('#subtotal').html(subtotal);
});

$('#is_need_tax_deduct').change(function () {
    renderStep2();
});

$('#deduct_percent').change(function () {
    if (this.value == 1) {
        tax_deduct_per_unit = tax_deduct_per_unit_1_percent;
    } else {
        tax_deduct_per_unit = tax_deduct_per_unit_3_percent;
    }
    price_with_vat_and_tax = price_per_unit - tax_deduct_per_unit + vat_per_unit;
    renderStep2();
})

$('[name="require_receipt"]').change(function () {
    if ($(this).prop('checked')) {
        $('#receipt_info').slideDown(250);
    } else {
        $('#receipt_info').slideUp(250);
        $('#receipt_info').find('input,textarea').val('');
    }
});

$('[name="require_tax_deduct"]').change(function () {
    if ($(this).prop('checked')) {
        $('#tax_deduct_document').slideDown(250);
    } else {
        $('#tax_deduct_document').slideUp(250);
        $('#tax_deduct_document').find('input,textarea').val('');
    }
    renderStep3($('#pay-item').val());
});

$('#facebook-login').click(function () {
    connected();
});

function connected() {
    $('.overlay').slideUp(250);
    renderStep2();
    renderStep3();
}

function goToStep(num, do_render) {

    if (do_render == undefined) do_render = true;

    var total = $('.step').size();
    var $container = $('#step' + (num + 1));

    for (var i = 0; i <= num; i++) {
        $('.step').eq(i).addClass('completed');
    }

    for (var i = num + 1; i < total; i++) {
        $('.step').eq(i).removeClass('completed');
    }

    $container.slideDown(250);
    $('#step1,#step2,#step3').not($container).slideUp(250);

    setTimeout(function () {
        $('html, body').animate({
            scrollTop: $container.offset().top - 50
        }, 250);
    }, 250);

    if (do_render) {
        switch (num) {
        case 1:
            renderStep2();
            break;
        case 2:
            renderStep3();
            break;
        }
    }

}

function renderStep2() {
    var tax_deduct = $('#is_need_tax_deduct').prop('checked');

    if (tax_deduct) {
        $('#deduct_warning').slideDown(250)
    } else {
        $('#deduct_warning').slideUp(250)
    }

    $('#paylist').html('');

    var render_rsvn = function (order, rsvn, tax_deduct) {
        var html = '<h3 class="font-2-em">ใบจองหมายเลข #' + order + ' (จำนวน ' + rsvn.seats + ' ที่นั่ง)</h3><table class="uk-table uk-table-hover">' +
            '<thead>' +
            '<tr>' +
            '<th>รายการ</th>' +
            '<th class="uk-text-right">ยอด</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>' +
            '<tr>' +
            '<td>ค่าอบรม (' + price_per_unit + ' x ' + rsvn.seats + ')</td>' +
            '<td class="uk-text-right">' + (price_per_unit * rsvn.seats).toFixed(2) + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>ภาษีมูลค่าเพิ่ม 7%</td>' +
            '<td class="uk-text-right">' + (vat_per_unit * rsvn.seats).toFixed(2) + '</td>' +
            '</tr>';
        if (tax_deduct) {
            html += '<tr>' +
                '<td>หักภาษี ณ ที่จ่าย ' + $('#deduct_percent').val() + '%</td>' +
                '<td class="uk-text-right">-' + (tax_deduct_per_unit * rsvn.seats).toFixed(2) + '</td>' +
                '</tr>' +
                '<tr style="background-color: #f5f5f5">' +
                '<td>ยอดที่ต้องชำระทั้งหมด</td>' +
                '<td class="uk-text-right"><b>' + (price_with_vat_and_tax * rsvn.seats).toFixed(2) + '</b></td>' +
                '</tr>' +
                '<tr style="background-color: #f5f5f5">' +
                '<td><small><a href="" data-cancel="' + rsvn.objectId + '" class="uk-text-danger">ยกเลิกใบจองนี้</a></small></td>' +
                '<td class="uk-text-right"><b>' + BAHTTEXT(price_with_vat_and_tax * rsvn.seats) + '</b></td>' +
                '</tr>';
        } else {
            html += '<tr style="background-color: #f5f5f5">' +
                '<td>ยอดที่ต้องชำระทั้งหมด</td>' +
                '<td class="uk-text-right"><b>' + (price_with_vat * rsvn.seats).toFixed(2) + '</b></td>' +
                '</tr>' +
                '<tr style="background-color: #f5f5f5">' +
                '<td><small><a href="" data-cancel="' + rsvn.objectId + '" class="uk-text-danger">ยกเลิกใบจองนี้</a></small></td>' +
                '<td class="uk-text-right"><b>' + BAHTTEXT(price_with_vat * rsvn.seats) + '</b></td>' +
                '</tr>';
        }
        html += '</tbody>' +
            '</table><div class="uk-text-right"><button data-pay="' + rsvn.objectId + '" class="uk-button uk-button-primary">แจ้งชำระเงินรายการนี้</button></div><hr>';
        $('#paylist').append(html);

    }


    // mockup data
    var rsvn = [{
        objectId: 'object1',
        seats: 2
    }, {

        objectId: 'object2',
        seats: 1
    }]


    if (rsvn.length > 0) {

        $('.no_rsvn_found').hide(0);
        rsvn.map(function (r, index) {
            render_rsvn(index + 1, r, tax_deduct);
        });

        $('[data-cancel]').click(function (e) {
            e.preventDefault();

            if (confirm('คุณแน่ใจแล้วหรือ?')) {

                // mockup
                var $table = $(this).parent().parent().parent().parent().parent();
                $table.slideUp(250);
                $table.next().next().slideUp(250);
                $table.next().slideUp(250);
                $table.prev().slideUp(250);

            }

            return false;
        });
        $('[data-pay]').click(function () {
            renderStep3($(this).data('pay'));
            goToStep(2, false)
        });

    } else {
        $('.no_rsvn_found').show(0);
    }

}

function renderStep3(objectId) {
    $('#pay-item').html('');
    
    // mockup data
    var r = [{
        objectId: 'object1',
        seats: 2
    }, {
        
        objectId: 'object2',
        seats: 1
    }]

    if (r.length > 0) {
        $('.no_rsvn_found').hide(0);
        $('#step3 button').removeAttr('disabled');

        for (var i in r) {
            if (objectId == r[i].objectId) {
                $('#pay-item').append('<option data-seats="' + r[i].seats + '" value="' + r[i].objectId + '" selected>ใบจองหมายเลข #' + (parseInt(i) + 1) + ' - ' + calculate_order(r[i]) + ' บาท (จำนวน ' + r[i].seats + ' ที่นั่ง)</option>');
            } else {
                $('#pay-item').append('<option data-seats="' + r[i].seats + '"  value="' + r[i].objectId + '">ใบจองหมายเลข #' + (parseInt(i) + 1) + ' - ' + calculate_order(r[i]) + ' บาท (จำนวน ' + r[i].seats + ' ที่นั่ง)</option>');
            }

        }

        var render_shirts_selector = function () {

            $('#shirts').html('');
            var seats = $('#pay-item').find('[value="' + $('#pay-item').val() + '"]').data('seats');
            var shirts = '';
            
            for (var i = 0; i < seats; i++) {
                shirts += '<label>' +

                    '<h3 class="font-1-5-em uk-display-inline">เสื้อตัวที่ ' + (i + 1) + ':</h3> &nbsp;&nbsp;' +
                    '<select class="shirt-size">' +
                    '<option value="m">M</option>' +
                    '<option value="l">L</option>' +
                    '<option value="xl">XL</option>' +
                    '</select>' +

                    '</label><br><br>';
            }
            $('#shirts').html(shirts);
        }

        render_shirts_selector();
        $('#pay-item').change(render_shirts_selector);

    } else {
        $('.no_rsvn_found').show(0);
        $('#step3 button').attr('disabled', 'disabled');
    }
}

function calculate_order(rsvn) {

    if ($('[name="require_tax_deduct"]').prop('checked')) {
        return currency_format(rsvn.seats * price_with_vat_and_tax);
    } else {
        return currency_format(rsvn.seats * price_with_vat);
    }
}