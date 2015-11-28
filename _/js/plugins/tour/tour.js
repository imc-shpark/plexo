$(function() {


    var tour = new Tour({
        storage:false,
        backdrop:false,
        steps:[
            {
                element: '#btn-labels-id',
                title: 'Labels <i class="pull-right fa fa-tag"></i>',
                content: 'Configure the labels you are going to use with this dataset',
                placement:'top'
            },
            {
                element: '#btn-brush-id',
                title :'Brush <i class="pull-right fa fa-paint-brush"></i>',
                content: 'Selects a label to annotate. <br/><br/>' +
                'Shortcuts: <b>Ctrl+A</b><br/>The first 9 labels can be selected with the keys 1-9<br/>'+
                'For options double click (mouse) or tap and hold (touch screen) on this button',
                placement: 'top'

            },
            { element:'#btn-paint-bucket-id',
                title:'Paint Bucket <i class="pull-right icon-bucket"></i>',
                content:'Fills a closed boundary with the current label<br/><br>'+
                    'Shortcuts: <b>Ctrl+S</b><br/>Paint bucket is automatically used by double clicking inside a closed '+
                    'boundary while the brush is selected (or by tap-and-hold when on a touchscreen)',
                placement: 'top'
            },
            {
                element:'#btn-eraser-id',
                title:'Eraser <i class="pull-right fa fa-eraser"></i>',
                content:'Removes annotations<br/><br/>'+
                    'Shortcuts:<b>Ctrl+D</b><br/>Eraser can remove a connected region by double clicking inside that region, '+
                    'or by tap-and-hold when using a touchscreen.<br/>'+
                'To see eraser options: double click (mouse) or tap and hold (touch screen) on this button',
                placement:'top'
            },
            {
                element:'#btn-zoom-id',
                title:'Zoom and Pan <i class="pull-right fa fa-search"></i><i class="pull-right fa fa-arrows"></i>',
                content:'Facilitates switching between zooming and panning modes. <br/><br/>'+
                    'Shortcuts: zooming is activated by <b>Ctrl+Mouse wheel</b>, while panning is activated by <b>Ctrl+mouse drag</b>',
                placement:'top'
            }

        ]});

   tour.init();
 $('#link-tour-id').click(function() {
     $('#navbar').collapse('hide');
     tour.restart();
 });

});