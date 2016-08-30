/**
 * that's app
 * Joseph Miao
 * 20160829 v1.0
 */


/*
 * Zepto picLazyLoad Plugin
 * origin: http://ons.me/484.html
 * 20140517 
 */

;(function($){
    $.fn.picLazyLoad = function(settings){
        var $this = $(this),
            _winScrollTop = 0,
            _winHeight = $(window).height();

        settings = $.extend({
            threshold: 0, 
            placeholder: 'data:image/png;base64,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'
        }, settings||{});

        lazyLoadPic();

        $(window).on('scroll',function(){
            _winScrollTop = $(window).scrollTop();
            lazyLoadPic();
        });

        function lazyLoadPic(){
            $this.each(function(){
                var $self = $(this);
                if($self.is('img')){
                    if($self.attr('data-original')){
                        var _offsetTop = $self.offset().top;
                        if((_offsetTop - settings.threshold) <= (_winHeight + _winScrollTop)){
                            $self.attr('src',$self.attr('data-original'));
                            $self.removeAttr('data-original');
                        }
                    }
                }else{
                    if($self.attr('data-original')){
                        if($self.css('background-image') == 'none'){
                            $self.css('background-image','url('+settings.placeholder+')');
                        }
                        var _offsetTop = $self.offset().top;
                        if((_offsetTop - settings.threshold) <= (_winHeight + _winScrollTop)){
                            $self.css('background-image','url('+$self.attr('data-original')+')');
                            $self.removeAttr('data-original');
                        }
                    }
                }
            });
        }
    }
})(Zepto);


/** 抽取数字 **/
function getNum(text){
    // i是表示区分大小写，g是全局模式如果不区分东西写
    var value = parseInt(text.replace(/[^0-9]/ig,"%")); 
    return value;
}

/** js控制页面字体大小 **/

function maginifyFontSize(){
    var root_size = $("html").css("font-size");

    if(getNum(root_size) >= 86){
        return;
    }
    var counter = 8; //每次放大百分比

    //判断font-size返回的是62.5%（百分比）还是10px(具体值)
    if(root_size.indexOf("px") > 0){ 
        var root_size_percent = getNum(root_size)*100/16;  //转换成百分比
        var percent = root_size_percent + counter;

    }else if(root_size.indexOf("%") > 0){
        //每次点击 字体增大的百分比
        var percent = getNum(root_size) + counter;
    }
    var changeSize = percent + "%";    
    $("html").css("font-size",changeSize);
    
}
function minifyFontSize(){
    var root_size = $("html").css("font-size");
    console.log(getNum(root_size));
    
    var counter = 8; //每次缩小百分比

    if(root_size.indexOf("px") > 0){ 
        var root_size_percent = getNum(root_size)*100/16;  //转换成百分比
        var percent = root_size_percent - counter;

    }else if(root_size.indexOf("%") > 0){
        if(getNum(root_size) <= 42) return;
        //每次点击 字体缩小的百分比
        var percent = getNum(root_size) - counter;
    }
    var changeSize = percent + "%";    
    $("html").css("font-size",changeSize);

}

/* slider轮播生成小圆点 */
function generateDots(){
    var imgs_len = $(".swipe-wrap").find("img").length;
    $(".swipe").append("<ul class='dots'></ul>")
    for(var i = 0; i < imgs_len; i++){
        $(".dots").append("<li></li>")
    }

}
/* 当前轮播图小圆点改样式 */
function getCurrentDot(index){
    //初始化高亮小圆点位置
    if(typeof(index) === "undefined" && !$(".dots > li:first-child").hasClass("active")){
        $(".dots > li:first-child").addClass("active");
    }else {
        $(".dots > li.active").removeClass("active");
        $(".dots").find("li:nth-child("+(index+1)+")").addClass("active");
    }

}
generateDots();
getCurrentDot();

