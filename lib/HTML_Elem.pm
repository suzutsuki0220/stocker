package HTML_Elem;

use utf8;
use Encode;
use Encode::Guess;

sub new {
  my $class = shift;
  my $self = {
    javascript => 0,
    css => 0,
    @_,
  };

  return bless $self, $class;
}

## ページのヘッダ部分 ##
sub header {
  my $self = shift;
  my($title) = @_;
  $title = encode('utf-8', $title) if(utf8::is_utf8($title));

  print "Content-Type: text/html\n\n";

  print <<EOF;
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="Content-Script-Type" content="text/javascript">
<meta http-equiv="Content-Style-Type" content="text/css">
<meta name="format-detection" content="telephone=no">
EOF

  if ($self->{'javascript'}) {
    foreach my $scr (@{$self->{'javascript'}}) {
      print "<script type=\"text/javascript\" src=\"".$scr."\"></script>\n";
    }
  }

  if ($self->{'css'}) {
    foreach my $css (@{$self->{'css'}}) {
      print "<link rel=\"stylesheet\" type=\"text/css\" href=\"".$css."\">\n";
    }
  }

  print encode('utf-8', "<title>${title}</title>\n");
  print <<EOF;
</head>
<body>
EOF

  return;
}

## ページの末尾に入れる閉めのタグ ##
sub tail {
  print <<EOF;
</body>
</html>
EOF

  return;
}

## スマホチェック ##
sub isSP {
  if(! $ENV{'HTTP_USER_AGENT'}) {
    # 不明な場合スマホ以外として扱う
    return 0;
  }

  my $agent = lc($ENV{'HTTP_USER_AGENT'});

  if(index($agent, "android") >=0 || index($agent, "mobile") >=0 ||
     index($agent, "ipod") >=0 || index($agent, "iphone") >=0  || index($agent, "ipad") >=0 )
  {
    return 1;
  }
  return 0;
}

## エラーメッセージ表示 ##
# 呼ぶ前に header() を実行してヘッダー部が出力されていること
sub error {
  my $self = shift;
  my($message) = @_;
  $message = encode('utf-8', $message) if(utf8::is_utf8($message));

  print encode('utf-8', "エラーが発生しました<br>\n");
  if( length($message) > 0 ) {
    print encode('utf-8', "原因: ") . $message . "\n";
  }

  &tail();

  exit(1);
}

## 表示データがタグ解釈されないようにエスケープする処理 ##
sub escape_html {
  my $self = shift;
  my($string) = @_;

  $string =~ s/&/&amp;/g;
  $string =~ s/"/&quot;/g;
  $string =~ s/</&lt;/g;
  $string =~ s/>/&gt;/g;

  $string =~ s/\r/&#x0d;/g;
  $string =~ s/\n/&#x0a;/g;

  return $string;
}

sub url_encode
{
  my $self = shift;
  my $input = shift;

  my $url_encode;
  if (utf8::is_utf8($input)) {
    $url_encode = encode_utf8($input);
  } else {
    $url_encode = $input;
  }
  $url_encode =~ s/([^ 0-9a-zA-Z])/"%".uc(unpack("H2",$1))/eg;
  $url_encode =~ s/ /+/g;

  return $url_encode;
}

sub url_decode
{
  my $self = shift;
  my $string = shift;

  $string =~ s/\+/ /g;
  $string =~ s/%([0-9a-fA-F]{2})/pack("H2",$1)/eg;
  $string = decode_utf8($string);

  return $string;
}

### 処理完了後のリダイレクト ###
sub redirect
{
  my $self = shift;
  my ($title, $note, $url) = @_;
  my $refresh = 1;  # リダイレクトを行うまでの待ち時間 (秒数)

  print "Content-Type: text/html\n\n";
  print <<EOD;
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Script-Type" content="text/javascript">
<meta http-equiv="Content-Style-Type" content="text/css">
<meta http-equiv="Refresh" content="${refresh}; url=${url}">
<title>${title}</title>
</head>
<body>
<p>
${title}<br><small>${note}</small><br>
<br>
<a href="${url}">OK</a>
</p>
</body>
</html>
EOD
}

1;
__END__

