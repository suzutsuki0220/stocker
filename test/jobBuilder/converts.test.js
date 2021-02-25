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
        encode_type: 'bitrate',
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
            return jobBuilder.converts(basicParams).then(job => {
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
        test('multiple choice', () => {
            const params = Object.assign({}, basicParams);
            params.path = [
                '/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq/5paw44GX44GE5YuV55S7Lm1wNA',
                '/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq/5paw44GX44GE5YuV55S7Mi5tcDQ'
            ];
            params.multi_editmode = 'sameenc';
            return jobBuilder.converts(params).then(job => {
                expect(job[0].command).toBe('/usr/bin/mkdir');
                expect(job[0].options).toBe("['-p', '/output/share/__CONVERTING__新しい動画']");
                expect(job[0].queue).toBe(0);

                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);

                expect(job[2].command).toBe('/usr/bin/mv');
                expect(job[2].options).toBe("['/output/share/__CONVERTING__新しい動画', '/output/share/新しい動画']");
                expect(job[2].queue).toBe(0);

                expect(job[3].command).toBe('/usr/bin/mkdir');
                expect(job[3].options).toBe("['-p', '/output/share/__CONVERTING__新しい動画2']");
                expect(job[3].queue).toBe(0);

                expect(job[4].command).toBe('/path/to/ffmpeg');
                expect(job[4].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画2.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画2/新しい動画2.mts\"]");
                expect(job[4].queue).toBe(0);

                expect(job[5].command).toBe('/usr/bin/mv');
                expect(job[5].options).toBe("['/output/share/__CONVERTING__新しい動画2', '/output/share/新しい動画2']");
            });
        });
        test('concat', () => {
            const params = Object.assign({}, basicParams);
            params.path = [
                '/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq/5paw44GX44GE5YuV55S7Lm1wNA',
                '/YmI/5pel5pys6Kqe44OH44Kj44Os44Kv44OI44Oq/5paw44GX44GE5YuV55S7Mi5tcDQ'
            ];
            params.multi_editmode = 'combine';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"concat:/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4|/path/to/cache/bb/日本語ディレクトリ/新しい動画2.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);
            });
        });
        test('2 pass encoding', () => {
            const params = Object.assign({}, basicParams);
            params.pass2 = 'true';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-pass\",\"1\",\"-passlogfile\",\"/output/share/__CONVERTING__新しい動画/passlog.dat\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/1pass_新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);

                expect(job[2].command).toBe('/path/to/ffmpeg');
                expect(job[2].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-pass\",\"2\",\"-passlogfile\",\"/output/share/__CONVERTING__新しい動画/passlog.dat\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/2pass_新しい動画.mts\"]");
                expect(job[2].queue).toBe(0);
            });
        });
        test('crf encoding', () => {
            const params = Object.assign({}, basicParams);
            params.format = 'mp4';
            params.encode_type = 'crf';
            params.crf = '28';
            params.preset = 'veryfast';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-crf\",\"28\",\"-preset\",\"veryfast\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mp4\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mp4\"]");
            });
        });
        test('no encoding video', () => {
            const params = Object.assign({}, basicParams);
            params.v_convert = 'none';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-vn\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
            });
        });
        test('no encoding audio', () => {
            const params = Object.assign({}, basicParams);
            params.a_convert = 'none';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-an\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
            });
        });
        test('copy video', () => {
            const params = Object.assign({}, basicParams);
            params.v_convert = 'copy';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"copy\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
            });
        });
        test('copy audio', () => {
            const params = Object.assign({}, basicParams);
            params.a_convert = 'copy';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"copy\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
            });
        });
        test('set position 1', () => {
            const params = Object.assign({}, basicParams);
            params.set_position = 'true';
            params.ss0 = '00:00:57.000';
            params.t0 = '02:08:36.696';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-ss\",\"00:00:57.000\",\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-t\",\"02:08:36.696\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/000057000_新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);
            });
        });
        test('set position 2', () => {
            const params = Object.assign({}, basicParams);
            params.set_position = 'true';
            params.ss0 = '00:01:57.000';
            params.t0 = '00:48:30.777';
            params.ss1 = '01:00:23.000';
            params.t1 = '01:08:36.696';
            return jobBuilder.converts(params).then(job => {
                expect(job[0].command).toBe('/usr/bin/mkdir');
                expect(job[0].options).toBe("['-p', '/output/share/__CONVERTING__新しい動画']");
                expect(job[0].queue).toBe(0);

                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-ss\",\"00:01:57.000\",\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-t\",\"00:48:30.777\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/000157000_新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);

                expect(job[2].command).toBe('/path/to/ffmpeg');
                expect(job[2].options).toBe("[\"-ss\",\"01:00:23.000\",\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-t\",\"01:08:36.696\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/010023000_新しい動画.mts\"]");
                expect(job[2].queue).toBe(0);

                expect(job[3].command).toBe('/usr/bin/mv');
                expect(job[3].options).toBe("['/output/share/__CONVERTING__新しい動画', '/output/share/新しい動画']");
                expect(job[3].queue).toBe(0);
            });
        });
        test('aspect setdar', () => {
            const params = Object.assign({}, basicParams);
            params.aspect_set = 'setdar';
            params.aspect_numerator = '16';
            params.aspect_denominator = '9';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080,setdar=ratio=16/9:max=1000\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);
            });
        });
        test('aspect setsar', () => {
            const params = Object.assign({}, basicParams);
            params.aspect_set = 'setsar';
            params.aspect_numerator = '1';
            params.aspect_denominator = '1';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080,setsar=ratio=1/1:max=1000\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);
            });
        });
        test('enable crop', () => {
            const params = Object.assign({}, basicParams);
            params.enable_crop = 'true';
            params.crop_w = '1440';
            params.crop_h = '1080';
            params.crop_x = '240';
            params.crop_y = '0';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,crop=1440:1080:240:0,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);
            });
        });
        test('enable pad', () => {
            const params = Object.assign({}, basicParams);
            params.enable_pad = 'true';
            params.pad_w = '1280';
            params.pad_h = '720';
            params.pad_x = '90';
            params.pad_y = '20';
            params.pad_color = 'white';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,pad=1280:720:90:20:white,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
            });
        });
        test('enable adjust', () => {
            const params = Object.assign({}, basicParams);
            params.enable_adjust = 'true';
            params.gamma = '1.2';
            params.contrast = '1.0';
            params.brightness = '0.7';
            params.rg = '0.1';
            params.gg = '-0.2';
            params.bg = '-0.3';
            params.weight = '0.9';
            params.hue = '1';
            params.saturation = '1.1';
            params.sharp = '0.8';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,eq=gamma=1.2:contrast=1.0:brightness=0.7:gamma_r=0.1:gamma_g=-0.2:gamma_b=-0.3:gamma_weight=0.9,hue=h=1:s=1.1,unsharp=3:3:0.8,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);
            });
        });
        test('audio volume', () => {
            const params = Object.assign({}, basicParams);
            params.volume = '2.0';
            return jobBuilder.converts(params).then(job => {
                expect(job[1].command).toBe('/path/to/ffmpeg');
                expect(job[1].options).toBe("[\"-i\",\"/path/to/cache/bb/日本語ディレクトリ/新しい動画.mp4\",\"-y\",\"-threads\",\"2\",\"-map\",\"0:0\",\"-c:v\",\"libx264\",\"-b:v\",\"15536k\",\"-r\",\"29.97\",\"-vf\",\"yadif=0:-1,scale=1920:1080\",\"-map\",\"0:1\",\"-c:a\",\"ac3\",\"-ac\",\"2\",\"-b:a\",\"128k\",\"-af\",\"volume=2.0\",\"-f\",\"mpegts\",\"/output/share/__CONVERTING__新しい動画/新しい動画.mts\"]");
                expect(job[1].queue).toBe(0);
            });
        });
    });
});
