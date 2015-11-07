/*-----------------------------------------------------------------------------------------------
 Annotation Set
 ------------------------------------------------------------------------------------------------*/
plx.AnnotationSet = function (dataset_id, user_id, annotation_set_id, labelset_id) {
    this.annotations = {}; //dictionary containing the slice-uri, annotation slice object pairing.
};

plx.AnnotationSet.load = function (anset_url) {
    //loads an annotationset given the corresponding JSON file URL
    // the JSON file contains:
    //    the location of the dataset
    //    the user identifier
    //    the location of the annotated set
    //    the location of the label set
};

plx.AnnotationSet.prototype.save = function () {
    // Does two things:
    //  1. Saves a set of annotated images png to a writable location
    //  2. Writes the corresponding anset_url (so we can load this later on).
};

plx.AnnotationSet.prototype.getAnnotation = function (slice_uri) {
    var aslice = undefined;
    if (!(slice_uri in this.annotations)) {
        aslice                      = new plx.AnnotationLayer(slice_uri);
        this.annotations[slice_uri] = aslice;
    }
    else {
        aslice = this.annotations[slice_uri];
    }
    return aslice;
};

plx.AnnotationSet.prototype.hasAnnotation = function (slice_uri) {
    return (slice_uri in this.annotations);
};
