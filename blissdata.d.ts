
interface BlissCharData {
    center : {[char:string] : number};
    chars : {[char:string] : {
        h? : number;
        w : number;
        d : {
            x : number;
            y : number;
            d : string;
        }[];
    }};
    kerning_left : {[char:string] : number};
    kerning_right : {[char:string] : number};
    paths : {[path:string] : {
        form : string;
        h : number; w : number;
        x? : number; y? : number;
        x1? : number; y1? : number;
        x2? : number; y2? : number;
        r? : number;
    }};
    shapes : {[shape:string] : {
        x : number;
        y : number;
        d : string;
    }[]};
}

interface BlissWordData {
    words : {[word:string] : string[]};
}
