#include <string>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include <cerrno>
#include <unistd.h>
#include <stdexcept>  // invalid argument

#include "cgi_util.h"

#define MAX_CONTENT_LEN 1024*1024

cgi_util::cgi_util()
{
    this->err_message = "";
    this->param.clear();
    this->max_content_length = MAX_CONTENT_LEN;
}

cgi_util::~cgi_util()
{
    this->param.clear();
}

std::string
cgi_util::get_err_message(void)
{
    return this->err_message;
}

std::string
cgi_util::get_value(const char *key)
{
    std::multimap<std::string, std::string>::iterator itr = param.find(key);
    if (itr != param.end()) {
        return itr->second;
    } else {
        return "";
    }
}

std::list<std::string>
cgi_util::get_values(const char *key)
{
    std::list<std::string> values;
    std::multimap<std::string, std::string>::iterator itr = param.find(key);

    while (itr != param.end()) {
        values.push_back(itr->second);
        itr++; 
    }

    return values;
}

/**
 * URLパラメータを解析してparamメンバーに代入
 **/
int
cgi_util::parse_param(void)
{
    std::string key;
    std::string value;
    bool keyget = false;

    std::string param_str = get_query();
    if (param_str.empty() && !err_message.empty()) {
        return -1;
    }

    std::string::iterator it = param_str.begin();
    while (it != param_str.end()) {
        if (*it == '&') {
            if (keyget) {
                param.insert(std::make_pair(key, value));
            }
            keyget = false;
            key.clear();
            value.clear();
        } else {
            if (*it == '=') {
                keyget = true;
            } else {
                if (keyget) {
                    value.push_back(*it);
                } else {
                    key.push_back(*it);
                }
            }
        }
        it++;
    }

    // last one
    if (keyget == true) {
        param.insert(std::make_pair(key, value));
    }

    return 0;
}

std::string
cgi_util::get_query(void)
{
    std::string ret = "";
    const char *method = getenv("REQUEST_METHOD");
    if (method) {
        if (strcmp(method, "GET") == 0) {
            const char *query = getenv("QUERY_STRING");
            if (query) {
                ret = query;
            }
        } else if (strcmp(method, "POST") == 0) {
            const char *clen;
            char buf[BUFSIZ] = {0};
            long long remain_len;
            clen = getenv("CONTENT_LENGTH");
            if (clen == NULL) {
                err_message = "no content length header";
                goto end;
            } else {
                char *endptr;
                remain_len = strtoll(clen, &endptr, 10);
                if (*endptr != '\0' || remain_len < 0) {
                    err_message = "invalid content length";
                    goto end;
                }
                if (remain_len > (long long)max_content_length) {
                    err_message = "content length too long";
                    goto end;
                }
            }
            while (remain_len > 0) {
                size_t read_len;
                size_t s = (long long)sizeof(buf) > remain_len ? (size_t)remain_len : sizeof(buf) -1;
                read_len = read(fileno(stdin), buf, s);
                if (read_len < 0) {
                    if (errno == EINTR) {
                        continue;
                    }
                    err_message = "query get failed - ";
                    err_message.append(strerror(errno));
                    goto end;
                } else if (read_len == 0) {
                    break;
                }
                ret += buf;
                memset(buf, '\0', sizeof(buf));
                remain_len -= (long long)read_len;
            }
            if (remain_len != 0) {
                ret.clear();
                err_message = "content length mismatch";
                goto end;
            }
        }
    }

end:
    return ret;
}

/**
 * Content-Lengthの受け入れる最大サイズを設定する
 * @param maxlength
 */
void
cgi_util::setMaxContentLength(size_t maxlength)
{
    this->max_content_length = maxlength;
}

/**
 * URLエンコードされた文字を元に戻す
 * @param str
 * @return 文字列
 */
std::string
cgi_util::decodeFormURL(std::string &str)
{
    std::string result = "";
    std::string::iterator it = str.begin();
    unsigned int encoded_cnt = 0;  // '%'が見つかりデコードする文字数
    unsigned char part_dec = 0;

    while (it != str.end()) {
        if (encoded_cnt > 0) {
            unsigned char c = *it;

            if (('0' <= c && c <= '9')) {
                c -= 0x30;
            } else if ('A' <= c && c <= 'F') { 
                c -= 0x37;  // 0x41(A) - A
            } else if ('a' <= c && c <= 'f')  {
                c -= 0x57;  // 0x61(a) - A
            } else {
                throw std::invalid_argument("a invalid hex digit");
            }

            if (encoded_cnt == 2) {
                part_dec |= (c << 4);
            } else if (encoded_cnt == 1) {
                part_dec |= c;
                result.push_back(part_dec);
                part_dec = 0;
            }

            encoded_cnt--;
        } else {
            if (*it == '%') {
                encoded_cnt = 2;
            } else {
                // 半角スペース(%20)が"+"の場合もある
                if (*it == '+') {
                    result.append(" ");
                } else {
                    result.push_back(*it);
                }
            }
        }
        it++;
    }

    if (encoded_cnt != 0) {
        // '%'以降の2文字が来ないまま終了したケース
        throw std::invalid_argument("encode string seems unfinished");
    }

    return result;
}

/**
 * 文字列をURLエンコードする
 * @param str
 * @return URLエンコードした文字列
 **/
std::string
cgi_util::encodeFormURL(std::string &str)
{
    std::string result = "";
    std::string::iterator it = str.begin();
    static const char* const lut = "0123456789ABCDEF";

    while (it != str.end()) {
        if (
                ('0' <= *it && *it <= '9') ||
                ('a' <= *it && *it <= 'z') ||
                ('A' <= *it && *it <= 'Z')
           ) {
            result.push_back(*it);
        } else {
            // 16進化して"%"に続けて表記する
            const unsigned char c = *it;
            result.push_back('%');
            result.push_back(lut[c >> 4]);  // 1byteの先頭4bitをHexに
            result.push_back(lut[c & 0xf]); // 1byteの後4bit (0xf -> 1111)
        }

        it++;
    }
 
    return result;
}

/**
 * charからビットを取得
 * @param c     (IN) charデータ
 * @param bits  (OUT)取得したBitデータ
 * @param start (IN) 取得開始位置
 * @param size  (IN) 取得するサイズ
 * @return 取得できたサイズ(Bit数)
 */
static size_t
get_bits(const unsigned char *c, unsigned char *bits, size_t start, size_t size)
{
    static size_t BIT_CHAR_SIZE = 8;
    size_t len = size;
    unsigned char mask = 0xff;

    if (BIT_CHAR_SIZE - start < size) {
        len = BIT_CHAR_SIZE - start;
    }

    mask = mask << (BIT_CHAR_SIZE - len);
    mask = mask >> start;

    *bits = (*c & mask) >> (BIT_CHAR_SIZE - start - len);

    return len;
}

/**
 * POSTされたBase64URLを元の文字列に戻す
 * @param data  文字列データ
 * @param str   Base64URL
 * @return 処理結果
 */
int
cgi_util::decodeBase64URL(std::string &str)
{
    std::string data;
    unsigned char *buff = NULL;
    size_t buff_size = 0;
    int ret;

    ret = decodeBase64URL(&buff, &buff_size, str);

    if (buff) {
        data.append((char*)buff, buff_size);
        free(buff);

        if (data.size() != buff_size) {
            // size mismatch (binary?)
            ret = -2;
        }
    }
    str = data;

    return ret;
}

/**
 * POSTされたBase64URLをバイナリに戻す
 * @param data  バイナリデータ
 * @param size  バイナリデータのサイズ
 * @param str   Base64URL
 * @return 処理結果
 */
int
cgi_util::decodeBase64URL(unsigned char **data, size_t *size, std::string &str)
{
    int ret = -1;

    // "-"を"+"に置換
    //
    // "_"を"/"に置換
    //

    // BASE64でバイナリに戻す

    ret = decodeBase64(data, size, str);  // Base64のデコードと共通処理

    return ret;
}

/**
 * Base64を元の文字列に戻す
 * @param data  文字列データ
 * @param str   Base64URL
 * @return 処理結果
 */
int
cgi_util::decodeBase64(std::string &str)
{
    std::string data;
    unsigned char *buff = NULL;
    size_t buff_size = 0;
    int ret;

    ret = decodeBase64(&buff, &buff_size, str);

    if (buff) {
        data.append((char*)buff, buff_size);
        free(buff);

        if (data.size() != buff_size) {
            // size mismatch (binary?)
            ret = -2;
        }
    }
    str = data;

    return ret;
}

/**
 * Base64をバイナリデータに戻す
 * @param data  バイナリデータ
 * @param size  バイナリデータのサイズ
 * @param str   Base64文字
 * @return 処理結果
 */
int
cgi_util::decodeBase64(unsigned char **data, size_t *size, std::string &str)
{
    static unsigned char base64[] = {
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf0, 0xff, 0xff, 0xf0, 0xff, 0xff,  /* 0x00 - 0x0F */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0x10 - 0x1F */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x3E, 0xff, 0x3E, 0xff, 0x3F,  /* 0x20 - 0x2F */
        0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0xff, 0xff, 0xff, 0xf0, 0xff, 0xff,  /* 0x30 - 0x3F */
        0xff, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E,  /* 0x40 - 0x4F */
        0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0xff, 0xff, 0xff, 0xff, 0x3F,  /* 0x50 - 0x5F */
        0xff, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28,  /* 0x60 - 0x6F */
        0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0x70 - 0x7F */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0x80 - 0x8F */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0x90 - 0x9F */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0xA0 - 0xAF */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0xB0 - 0xBF */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0xC0 - 0xCF */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0xD0 - 0xDF */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  /* 0xE0 - 0xEF */
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff   /* 0xF0 - 0xFF */
    };

    static size_t BIT_SPLIT_SIZE = 6;
    static size_t BIT_CHAR_SIZE  = 8;

    int ret = -1;
    size_t want_bits = BIT_CHAR_SIZE;
    unsigned char bit_data = 0;
    std::string::iterator it = str.begin();

    *size = 0;
    size_t buffsize = (size_t)((float)str.size() * 0.75);
    *data = (unsigned char*)calloc(buffsize, sizeof(char));
    if (*data == NULL) {
        throw std::bad_alloc();
    }

    while (it != str.end()) {
        unsigned char dbit = base64[(int)*it];
        if (dbit == 0xff) { // invalid
            //throw std::invalid_argument("invalid Base64 character");  // ここでthrowするとdataがfreeされない
            goto END;
        } else if (dbit == 0xf0) {  // ignore
            // skip
            it++;
            continue;
        }

        size_t bit_remain = BIT_SPLIT_SIZE;
        while (bit_remain > 0) {
            size_t bits_len = 0;
            unsigned char bits = 0;

            if (buffsize <= *size) {
                // prevent buffer overflow
                break;
            }
            bits_len = get_bits(&dbit, &bits, BIT_CHAR_SIZE - bit_remain, want_bits);
            bit_remain -= bits_len;
            want_bits  -= bits_len;
            if (want_bits == 0) {
                bit_data |= bits;
                want_bits = BIT_CHAR_SIZE;
                *(*data + *size) = bit_data;
                *size += 1;
                bit_data = 0;
            } else {
                bit_data |= bits << want_bits;
            }
        }

        it++;
    }
    ret = 0;
 
END:
    if (ret == -1) {
        if (*data) {
            free(*data);
            *data = NULL;
        }   
        *size = 0;
    }

    return ret;
}

/**
 * バイナリデータをBase64URL形式にエンコードする
 * @param data 文字列データ
 * @return Base64URL形式の文字列
 **/
std::string
cgi_util::encodeBase64URL(std::string &data)
{
    return encodeBase64URL((unsigned char*)data.c_str(), data.size());
}

/**
 * バイナリデータをBase64URL形式にエンコードする
 * @param data バイナリデータ
 * @param size バイナリデータのサイズ
 * @return Base64URL形式の文字列
 **/
std::string
cgi_util::encodeBase64URL(const unsigned char *data, size_t size)
{
    std::string result;
    std::string::size_type pos; 

    // BASE64でテキスト化
    result = encodeBase64(data, size);
 
    // "+"を"-"に置換
    pos = result.find("+");
    while (pos != std::string::npos) {
        result.replace(pos, 1, "-");  // 1 -> length of "+"
        pos = result.find("+", pos + 1);
    }

    // "/"を"_"に置換
    pos = result.find("/");
    while (pos != std::string::npos) {
        result.replace(pos, 1, "_");  // 1 -> length of "+"
        pos = result.find("/", pos + 1);
    }

    return result;
}

/**
 * バイナリデータをBase64形式にエンコードする
 * @param data 入力文字
 * @return Base64形式の文字列
 **/
std::string
cgi_util::encodeBase64(std::string &data)
{
    return encodeBase64((unsigned char*)data.c_str(), data.size());
}

/**
 * バイナリデータをBase64形式にエンコードする
 * @param data バイナリデータ
 * @param size バイナリデータのサイズ
 * @return Base64形式の文字列
 **/
std::string
cgi_util::encodeBase64(const unsigned char *data, size_t size)
{
    static unsigned char base64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    static size_t BIT_SPLIT_SIZE = 6;
    static size_t BIT_CHAR_SIZE  = 8;

    std::string result;
    unsigned int pos = 0;
    size_t want_bits = BIT_SPLIT_SIZE;
    unsigned char bit_data = 0;

    while (pos < size) {
        size_t str_remain = BIT_CHAR_SIZE;

        while (str_remain > 0) {
            size_t bits_len = 0;
            unsigned char bits = 0;

            bits_len = get_bits(data + pos, &bits, BIT_CHAR_SIZE - str_remain, want_bits);
            str_remain -= bits_len;
            want_bits  -= bits_len;
            if (want_bits == 0) {
                bit_data |= bits;
                result.push_back(base64[bit_data]);
                want_bits = BIT_SPLIT_SIZE;
                bit_data = 0;
            } else {
                bit_data |= bits << want_bits;
            }
        }

        pos++;
    }

    // 6bitに満たなかった部分を書き出す
    if (want_bits < BIT_SPLIT_SIZE && want_bits > 0) {
        result.push_back(base64[bit_data]);
        want_bits = 0;
    }

    // 4文字に満たなかった分を'='で埋める
    for (size_t i=result.size() % 4; i>0; i--) {
        result.append("=");
    }

    return result;
}

/**
 * 表示データがタグ解釈されないようにエスケープする処理
 * @param data データ
 * @return escapeしたデータ
 **/
std::string
cgi_util::escapeHtml(std::string &data)
{
    unsigned int i;
    std::string d, escaped_data;
    std::string::size_type spos, epos;
    const char *table[] = {
         "&", "&amp;"
        ,"<", "&lt;"
        ,">", "&gt;"
        ,"\"", "&quot;"
        ,"\r", "&#x0d;"
        ,"\n", "&#x0a;"
    };

    // replace work
    d = data;
    for (i=0; i<sizeof(table) / sizeof(table[0]); i+=2) {
        escaped_data.clear();
        spos = 0;
        while ((epos = d.find(table[i], spos)) != std::string::npos) {
            if (spos != epos) {
                escaped_data.append(d.substr(spos, epos));
            }
            escaped_data.append(table[i+1]);
            spos = epos + strlen(table[i]);
        }
        if (spos != d.length()) {
            escaped_data.append(d.substr(spos, d.length() - spos));
        }
        d = escaped_data;
    }

    return escaped_data;
}

