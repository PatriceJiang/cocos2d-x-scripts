#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv)
{
    pid_t cpid, w;
    int status;



    int retry_times= 10;
    int arg_offset = 1;

    if(argc > 3 && strcmp(argv[1], "-n") == 0 && atoi(argv[2]) != 0)
    {
        retry_times = atoi(argv[2]);
        arg_offset = 3;
    }

    int try_times = 0;

start_subprocess:

    try_times++;

    if(retry_times <= try_times)
    {
        printf("  Try too many times %d, abort.\n", try_times);
        exit(EXIT_FAILURE);
    }


    cpid = fork();
    if (cpid == -1)
    {
        perror("fork");
        exit(EXIT_FAILURE);
    }

    if (cpid == 0) // child process
    {
        printf("RUN: %d/%d\n  ",try_times, retry_times);
        for(int  i = arg_offset; i < argc; i++)
        {
            printf("%s ", argv[i]);
        }
        printf("\n");

        int exec_code = execvp(argv[arg_offset], argv + arg_offset);
        if(exec_code)
        {
            perror("exec");
        }
        printf(" < subprocess!\n");
        exit(exec_code);
    }
    else
    {
        do
        {
            w = waitpid(cpid, &status, WUNTRACED | WCONTINUED);
            if (w == -1)
            {
                perror("waitpid");
                exit(EXIT_FAILURE);
            }

            if (WIFEXITED(status))
            {
                printf("exited, status=%d\n", WEXITSTATUS(status));
            }
            else if (WIFSIGNALED(status))
            {
                printf("killed by signal %d\n", WTERMSIG(status));
            }
            else if (WIFSTOPPED(status))
            {
                printf("stopped by signal %d\n", WSTOPSIG(status));
            }
            else if (WIFCONTINUED(status))
            {
                printf("continued\n");
            }
        } while (!WIFEXITED(status) && !WIFSIGNALED(status));
        if(status != 0) {
            printf("retry ... exit code %d \n", status);
            goto start_subprocess;
        }
    }

    return 0;
}