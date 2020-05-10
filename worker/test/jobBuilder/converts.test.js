describe('jobBuilder/converts', () => {
    let jobBuilder;

    const basicParams = {
        root: 'cache',
        path: '/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq/5paw44GX44GE5YuV55S7Lm1wNA',
        out_root: 'share',
        out_path: '',
        ss0: '00:00:00.000',
        t0: '00:00:00.000',
        a_codec: 'ac3',
        a_convert: 'convert',
        a_map: '1',
        a_option: '',
        ab: '128',
        ac: '2',
        ar: '',
        aspect_denominator: '',
        aspect_numerator: '',
        aspect_set: 'none',
        b: '15536',
        bg: '1.0',
        brightness: '0.0',
        contrast: '1.0',
        crop_h: '',
        crop_w: '',
        crop_x: '',
        crop_y: '',
        cutoff: '0',
        deinterlace: 'true',
        deshake: 'false',
        enable_adjust: 'false',
        enable_crop: 'false',
        enable_pad: 'false',
        format: 'mts',
        gamma: '1.0',
        gg: '1.0',
        hue: '0.0',
        multi_editmode: '',
        pad_color: 'black',
        pad_h: '',
        pad_w: '',
        pad_x: '',
        pad_y: '',
        pass2: 'false',
        r: '29.97',
        rg: '1.0',
        s_h: '1080',
        s_w: '1920',
        saturation: '1.0',
        set_position: 'false',
        sharp: '1.0',
        v_codec: 'libx264',
        v_convert: 'convert',
        v_map: '0',
        v_option: '',
        volume: '1.0',
        weight: '1.0'
    };

    beforeEach(() => {
        jobBuilder = require('../../src/jobBuilder');
    });

    describe('converts', () => {
        test('single movie', () => {
            jobBuilder.converts(basicParams).then(job => {
                expect(job[0].command).toBe('/usr/bin/mkdir');
                expect(job[0].options).toBe("['-p', '/output/share/__CONVERTING__新しい動画']");
                expect(job[0].queue).toBe(0);

                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);

                expect(job[2].command).toBe('/usr/bin/mv');
                expect(job[2].options).toBe("['/output/share/__CONVERTING__新しい動画', '/output/share/新しい動画']");
                expect(job[2].queue).toBe(0);
            });
        });
        test('2 pass encoding', () => {
            const params = Object.assign({}, basicParams);
            params.pass2 = 'true';
            jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-pass\",\"1\",\"-passlogfile\",\"/output/share/__CONVERTING__新しい動画/passlog.dat\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/1pass_新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);

                expect(job[2].command).toBe('/path/to/ffmpeg');
                expect(job[2].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-pass\",\"2\",\"-passlogfile\",\"/output/share/__CONVERTING__新しい動画/passlog.dat\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/2pass_新しい動画.mts\"]");
                expect(job[2].queue).toBe(0);
            });
        });
    });
});
