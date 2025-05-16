package main

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/jamesrr39/go-errorsx"
	"gopkg.in/alecthomas/kingpin.v2"
)

func main() {
	packageName := kingpin.Flag("package-name", "").Required().String()
	outFilePath := kingpin.Flag("output-file", "").String()
	kingpin.Parse()

	errorsx.ExitIfErr(run(*packageName, *outFilePath))
}

func run(packageName string, outFilePath string) errorsx.Error {
	b, err := os.ReadFile("vendor/github.com/tormoder/fit/types.go")
	if err != nil {
		return errorsx.Wrap(err)
	}

	allLines := strings.Split(string(b), "\n")
	var lines []string
	for _, line := range allLines {
		if !strings.Contains(line, "GarminProduct = ") {
			continue
		}

		line = strings.ReplaceAll(line, "GarminProduct", "")
		line = strings.TrimSpace(line)

		equalsIdx := strings.Index(line, "=")
		productName := fixName(strings.TrimSpace(line[:equalsIdx]))

		codeAndComment := strings.TrimSpace(line[equalsIdx+1:])

		codeAndCommentNextSpaceIdx := strings.Index(codeAndComment, " ")
		code := codeAndComment

		if codeAndCommentNextSpaceIdx == -1 {
			code := codeAndComment

			lines = append(lines, fmt.Sprintf("\t{Name: %q, Code: %s},", productName, code))
		} else {
			code = codeAndComment[:codeAndCommentNextSpaceIdx]
			comment := strings.TrimSpace(strings.ReplaceAll(codeAndComment[codeAndCommentNextSpaceIdx:], "//", ""))

			lines = append(lines, fmt.Sprintf("\t{Name: %q, Code: %s, Comment: %q},", productName, code, comment))
		}
	}

	outContents := fmt.Sprintf(`// Code generated. DO NOT EDIT
package %s

type GarminProduct struct {
	Name string
	Code int
	Comment string
}

var GarminProducts = []GarminProduct{
%s
}
`, packageName, strings.Join(lines, "\n"))

	if outFilePath == "" {
		_, err = io.Copy(os.Stdout, bytes.NewBufferString(outContents))
		if err != nil {
			return errorsx.Wrap(err)
		}
	} else {
		err = os.WriteFile(outFilePath, []byte(outContents), 0644)
		if err != nil {
			return errorsx.Wrap(err)
		}
	}

	return nil
}

func fixName(inName string) string {
	inName = strings.ReplaceAll(inName, "Fr", "Forerunner")
	// strings.
	var fragments []string
	var currentFragment string
	for _, char := range inName {
		if currentFragment == "" {
			currentFragment += string(char)
			continue
		}

		prevChar := rune(currentFragment[len(currentFragment)-1])
		shouldContinueCat := shouldContinueSection(char, prevChar)
		if shouldContinueCat {
			currentFragment += string(char)
			continue
		}

		fragments = append(fragments, currentFragment)
		currentFragment = string(char)
	}

	if currentFragment != "" {
		fragments = append(fragments, currentFragment)
	}

	return strings.Join(fragments, " ")
}

func isUpperCase(char rune) bool {
	asciiCode := int(char)

	return asciiCode >= 65 && asciiCode <= 90
}

func isLowerCase(char rune) bool {
	asciiCode := int(char)

	return asciiCode >= 97 && asciiCode <= 122
}

func isNumber(char rune) bool {
	asciiCode := int(char)

	return asciiCode >= 48 && asciiCode <= 57
}

func shouldContinueSection(thisChar, prev rune) bool {
	if isUpperCase(thisChar) {
		if isUpperCase(prev) {
			return true
		}
		return false
	}
	if isLowerCase(thisChar) {
		if isNumber(prev) {
			return false
		}
		return true
	}
	if isNumber(thisChar) {
		if isNumber(prev) {
			return true
		}
		return false
	}
	panic("didn't understand: " + string(thisChar))
}
