/* カーネルのマウント情報を取り出して、マウントポイントを出力するサンプル */

#include <stdio.h>
#include <mntent.h>

#define PATH_MTAB_FILE "/proc/mounts"

int main(int argc, char **argv)
{
    FILE *mount_table = NULL;
    struct mntent *mount_entry = NULL;

    mount_table = setmntent(PATH_MTAB_FILE, "r");
    if (mount_table == NULL) {
        fprintf(stderr, "failed to open mtab entry\n");
        return -1;
    }

    while(1) {
        const char *mount_point;
        const char *fs_type;

        mount_entry = getmntent(mount_table);
        if (mount_entry == NULL) {
            endmntent(mount_table);
            break;
        }

        mount_point = mount_entry->mnt_dir;
        fs_type = mount_entry->mnt_type;

        printf("Mount Point: %s\n", mount_point);
        printf("Filesystem:  %s\n", fs_type);
    }
    
    return 0;
}

